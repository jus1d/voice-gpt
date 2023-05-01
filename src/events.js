import { Markup } from "telegraf";
import { vocieToText } from './voice.js';
import { isAdmin } from "./utils.js";
import { code } from 'telegraf/format';
import { logger as log } from "./logger.js";
import { openAI } from './openai.js';
import { mongo } from './mongo.js';
import crc32 from 'crc32';
import config from 'config';

const INITIAL_SESSION = { messages: [] };
const ADMIN_TG_ID = config.get('admin_tg_id');

class EventHandler {
    constructor() {}

    async onStart(ctx) {
        const user = await mongo.getUser(ctx.message.from.id);

        if (!user) {
            await mongo.saveUser(ctx.message.from.id, ctx.message.from.username, ctx.message.from.first_name);
        }

        log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} started the bot`);

        const conversation = await mongo.getConversation(ctx.message.from.id);
        if (conversation) {
            ctx.session = conversation;
        } else {
            ctx.session = INITIAL_SESSION;
            await mongo.saveConversation(ctx.session.messages, ctx.message.from);
        }
        await ctx.reply('Hi! You can send me your questions, and I will reply to them!\n\nbtw: Voice messages supports too');
    }

    async onVoiceMessage(ctx) {
        const user = await mongo.getUser(ctx.message.from.id);
        const conversation = await mongo.getConversation(String(ctx.message.from.id));

        if (conversation) {
            ctx.session = { messages: conversation.messages };
        } else {
            ctx.session = INITIAL_SESSION;
            await mongo.saveConversation(ctx.session.messages, ctx.message.from);
        }

        if (!user) {
            return await ctx.reply('Please use /start command to start the bot');
        }

        if (user.list !== 'white') {
            log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} request rejected. User not whitelisted`);
            return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins 👇', Markup.inlineKeyboard([
                Markup.button.callback("Request", "request_whitelist_slot")
            ]));
        }

        log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} request created from voice message`);

        try {
            const message = await ctx.reply(code('Already processing your request, wait a bit'));
            await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

            const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
            const userId = String(ctx.message.from.id);
            const unixTime = String(Math.floor(Date.now() / 1000));
            const hash = crc32(`${unixTime}${ctx.message.id}`).toString(16);

            const fileName = `${userId}_${hash}`;
            await vocieToText.createOggFile(link.href, fileName);
            await vocieToText.createMp3File(fileName);

            const prompt = await openAI.transcript(fileName);
            ctx.session.messages.push({ role: 'user', content: prompt });
            const gptResponse = await openAI.chat(ctx.session.messages);
            if (gptResponse) {
                ctx.session.messages.push({ role: 'assistant', content: gptResponse.content });
                await mongo.updateConversation(ctx.session.messages, ctx.message.from.id);
                await mongo.addRequestCounter(ctx.message.from.id);
                
                ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                ctx.reply(gptResponse.content);
            } else {
                ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                ctx.reply('No response from ChatGPT. Try again later or use /new to create new conversation.');
            }
        } catch (error) {
            log.error(`Error with creating request. User: ${log.usernameFormat(`@${ctx.message.from.username}:${ctx.message.from.id}`)}\nError: ${error.message}`);
            ctx.reply('There was an error in your query. Please try again later');
        }
    }

    async onTextMessage(ctx) {
        const user = await mongo.getUser(ctx.message.from.id);
        const conversation = await mongo.getConversation(ctx.message.from.id);

        if (conversation) {
            ctx.session = { messages: conversation.messages };
        } else {
            ctx.session = INITIAL_SESSION;
            await mongo.saveConversation(ctx.session.messages, ctx.message.from);
        }

        if (!user) {
            return await ctx.reply('Please use /start command to start the bot');
        }

        if (user.list !== mongo.list.WHITE) {
            log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} request rejected. User not whitelisted`);
            return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins 👇', Markup.inlineKeyboard([
                Markup.button.callback("Request", "request_whitelist_slot")
            ]));
        }

        log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} request created from text message`);

        try {
            const message = await ctx.reply(code('Already processing your request, wait a bit'));
            await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
            
            ctx.session.messages.push({ role: openAI.roles.USER, content: ctx.message.text });
            const gptResponse = await openAI.chat(ctx.session.messages);
            if (gptResponse) {
                ctx.session.messages.push({ role: openAI.roles.ASSISTANT, content: gptResponse.content });
                await mongo.updateConversation(ctx.session.messages, ctx.message.from.id);
                await mongo.addRequestCounter(ctx.message.from.id);
                
                ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                ctx.reply(gptResponse.content);
            } else {
                ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                ctx.reply('No response from ChatGPT. Try again later or use /new to create new conversation.');
            }
        } catch (error) {
            log.error(`Error with creating request. User: @${ctx.message.from.username}:${ctx.message.from.id}\nError: ${error}`);
            ctx.reply('There was an error in your query. Please try again later');
        }
    }

    async onRequestCallback(ctx) {
        ctx.editMessageText('Request to be added to the whitelist has been sent to admins. Please wait a little whle');

        log.info(`User @${ctx.from.username}:${ctx.from.id} requested a whitelist slot`);

        ctx.telegram.sendMessage(ADMIN_TG_ID, `@${ctx.from.username} [${ctx.from.id}] requested a whitelist slot`, Markup.inlineKeyboard([
            Markup.button.callback("✅ Approve", "approve"),
            Markup.button.callback("❌ Reject", "reject")
        ]));
    }

    async onApproveCallback(ctx) {
        if (!(await isAdmin(ctx.from.id))) return;

        const userId = Number(ctx.update.callback_query.message.text.split(' ')[1].replace('[', '').replace(']', ''));
        const username = ctx.update.callback_query.message.text.split(' ')[0].replace('@', '');

        const res = await mongo.updateUserList(userId, mongo.list.WHITE);

        if (res) {
            ctx.telegram.sendMessage(userId, '🥳 Your request to be added to the whitelist has been approved by the admins.\n\nYou are whitelisted and can use the bot! Just send text message or record voice');
            ctx.editMessageText(`✅ Access for @${username} was granted`);
            log.success(`User @${username}:${userId} was added to whitelist`);
        } else {
            ctx.editMessageText(`❌ Something went wrong while approving access to @${username}`);
            log.error(`There are an error while adding user @${username}:${userId} to whitelist`);
        }
    }

    async onRejectCallback(ctx) {
        if (!(await isAdmin(ctx.from.id))) return;

        const userId = Number(ctx.update.callback_query.message.text.split(' ')[1].replace('[', '').replace(']', ''));
        const username = ctx.update.callback_query.message.text.split(' ')[0].replace('@', '');

        ctx.editMessageText(`❌ Access for @${username} was rejected`);
        log.success(`Reject access for user @${username}:${userId}`);
        ctx.telegram.sendMessage(userId, '❌ Your request to be added to the whitelist was rejected by the admins');
    }

}

export const eventHandler = new EventHandler();