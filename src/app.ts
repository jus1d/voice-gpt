import { IConversation } from './database/models/conversation.model';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { mongo } from './database/mongo';
import { code } from 'telegraf/format';
import { log } from './logger/logger';
import { voiceToText } from './voice';
import { Message } from 'typegram';
import { openAI } from './openai';
import mongoose from 'mongoose';
import { Md5 } from 'ts-md5';
import config from 'config';

const bot = new Telegraf(config.get('telegram_token'));

bot.command('start', async (ctx) => {
    const user = await mongo.getUser(ctx.message.from.id);

    if (!user) {
        await mongo.saveUser(ctx.message.from.id, ctx.message.from.username ??= '', ctx.message.from.first_name);
    }

    log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} started the bot`);

    const conversation = await mongo.getConversation(ctx.message.from.id);
    if (!conversation) {
        await mongo.initConversation(ctx.message.from.id);
    }
    await ctx.reply('Hi! You can send me your questions, and i will reply to them!\n\nbtw: Voice messages supports too');
});

bot.command('whitelist', async (ctx) => {
    try {
        const isAdmin = await mongo.isAdmin(ctx.message.from.id);
        if (!isAdmin) return;

        let whiteCounterUsers = 0;
            let limitedCounterUsers = 0;
            let whitelistedUsers = '';
            let limitedUsers = '';
            let whitelistStr = '';
            const whitelist = await mongo.getWhitelistedUsers();

            if (!whitelist) {
                await ctx.reply('Error while getting whitelisted users');
                log.error(`Error while getting whitelisted users: No response from database`);
                return;
            }
        
            for (let i = 0; i < whitelist.length; i++) {
                if (whitelist[i].list === mongo.list.white) {
                    whitelistedUsers += `@${whitelist[i].username} - ${whitelist[i].requests} requests, for reject: /reject@${whitelist[i].telegramId}\n`;
                    whiteCounterUsers++;
                } else if (whitelist[i].list === mongo.list.limited) {
                    limitedUsers += `@${whitelist[i].username} - ${whitelist[i].requests} requests, for reject: /reject@${whitelist[i].telegramId}\n`;
                    limitedCounterUsers++;
                }
            }
        
            if (whiteCounterUsers !== 0) {
                whitelistStr += `Whitelisted users: ${whiteCounterUsers}\n\n${whitelistedUsers}\n`;
            }
            if (limitedCounterUsers !== 0) {
                whitelistStr += `Limited users: ${whiteCounterUsers}\n\n${limitedUsers}`;
            }
            if (whiteCounterUsers === 0 && limitedCounterUsers === 0) {
                whitelistStr = 'No whitelisted users yet'
            }
        
            await ctx.reply(whitelistStr);

    } catch (error) {
        await ctx.reply('Error while getting whitelisted users');
        log.error(`Error while getting whitelisted users\n${error}`);
    }
});

bot.command('new', async (ctx) => {
    await mongo.updateConversation(ctx.message.from.id, []);
    await ctx.reply('New chat created!');
    log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} created new chat context`);
});

bot.command('id', async (ctx) => {
    ctx.reply(String(ctx.message.from.id));
});

bot.hears(/\/reject@(\d+)/, async (ctx) => {
    const isAdmin = await mongo.isAdmin(ctx.message.from.id);
    if (!isAdmin) return;

    const telegramId = Number(ctx.message.text.replace('/reject@', ''));
    const user = await mongo.getUser(telegramId);
    if (!user) {
        await ctx.reply(`Error while rejecting user with ID: ${telegramId}`);
        log.error(`Error while rejecting user with ID: ${telegramId}: No response from database`);
        return;
    }
    try {
        await mongo.setUserList(telegramId, mongo.list.none);
        await ctx.reply(`Access for @${user.username} [${user.telegramId}] was rejected`);
        log.info(`Access for @${user.username}:${user.telegramId} was rejected`);
    } catch (error) {
        await ctx.reply(`Error while rejecting @${user.username} [${user.telegramId}]`);
        log.error(`Error while rejecting user @${user.username}:${user.telegramId}\n${error}`);
    }
});

bot.on(message('voice'), async (ctx) => {
    const user = await mongo.getUser(ctx.message.from.id);
    if (!user) {
        return await ctx.reply('Please use /start command to start the bot');
    }

    let conversation: IConversation | null  = await mongo.getConversation(ctx.message.from.id);
    if (!conversation) {
        await mongo.initConversation(ctx.message.from.id);
    }
    conversation = await mongo.getConversation(ctx.message.from.id);

    if (!conversation) return;

    if (user.list !== mongo.list.white) {
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
        const fileName = Md5.hashStr(`${userId}${unixTime}`);

        await voiceToText.downloadOggFile(link.href, fileName);
        await voiceToText.convertOggToMp3(fileName);

        const prompt = await openAI.transcript(fileName);
        if (!prompt) return ctx.reply(`Your voice message is not recognized`);

        conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: prompt });
        const gptResponse = await openAI.chat(conversation.messages);
        
        if (gptResponse) {
            conversation.messages.push({ role: 'assistant', content: gptResponse.content });
            await mongo.updateConversation(ctx.message.from.id, conversation.messages);
            await mongo.incrementRequestsCounter(ctx.message.from.id);
                
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply(gptResponse.content);
        } else {
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply('No response from ChatGPT. Try again later or use /new to create new conversation.');
        }
    } catch (error) {
        log.error(`Error with creating request. User: @${ctx.message.from.username}:${ctx.message.from.id}\n${error}`);
        ctx.reply('There was an error in your query. Please try again later');
    }
});

bot.on(message('text'), async (ctx) => {
    const user = await mongo.getUser(ctx.message.from.id);
    if (!user) {
        return await ctx.reply('Please use /start command to start the bot');
    }

    let conversation: IConversation | null  = await mongo.getConversation(ctx.message.from.id);
    if (!conversation) {
        await mongo.initConversation(ctx.message.from.id);
    }
    conversation = await mongo.getConversation(ctx.message.from.id);

    if (!conversation) return;

    if (user.list !== mongo.list.white) {
        log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} request rejected. User not whitelisted`);
        return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins 👇', Markup.inlineKeyboard([
            Markup.button.callback("Request", "request_whitelist_slot")
        ]));
    }

    log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} request created from text message`);

    try {
        const message = await ctx.reply(code('Already processing your request, wait a bit'));
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
            
        conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: ctx.message.text });
        const gptResponse = await openAI.chat(conversation.messages);
        if (gptResponse) {
            conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.Assistant, content: gptResponse.content });
            await mongo.updateConversation(ctx.message.from.id, conversation.messages);
            await mongo.incrementRequestsCounter(ctx.message.from.id);
                
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply(gptResponse.content);
        } else {
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply('No response from ChatGPT. Try again later or use /new to create new conversation.');
        }
    } catch (error) {
        log.error(`Error with creating request. User: @${ctx.message.from.username}:${ctx.message.from.id}\n${error}`);
        ctx.reply('There was an error in your query. Please try again later');
    }
});

bot.action('request_whitelist_slot', async (ctx) => {
    ctx.editMessageText('Request to be added to the whitelist has been sent to admins. Please wait a little whle');

    if (!ctx.from) return;

    log.info(`User @${ctx.from.username}:${ctx.from.id} requested a whitelist slot`);

    ctx.telegram.sendMessage(config.get('admin_tg_id'), `@${ctx.from.username} [${ctx.from.id}] requested a whitelist slot`, Markup.inlineKeyboard([
        Markup.button.callback("✅ Approve", "approve"),
        Markup.button.callback("❌ Reject", "reject")
    ]));
});

bot.action('approve', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;
    if (!ctx.update.callback_query.message) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('[', '').replace(']', ''));
    const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[0].replace('@', '');

    const res = await mongo.setUserList(userId, mongo.list.white);

    if (res) {
        ctx.telegram.sendMessage(userId, '🥳 Your request to be added to the whitelist has been approved by the admins.\n\nYou are whitelisted and can use the bot! Just send text message or record voice');
        ctx.editMessageText(`✅ Access for @${username} was granted`);
        log.info(`User @${username}:${userId} was added to whitelist`);
    } else {
        ctx.editMessageText(`❌ Something went wrong while approving access to @${username}`);
        log.error(`There are an error while adding user @${username}:${userId} to whitelist`);
    }
});

bot.action('reject', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;
    if (!ctx.update.callback_query.message) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('[', '').replace(']', ''));
    const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[0].replace('@', '');

    ctx.editMessageText(`❌ Access for @${username} was rejected`);
    log.info(`Reject access for user @${username}:${userId}`);
    ctx.telegram.sendMessage(userId, '❌ Your request to be added to the whitelist was rejected by the admins');
});

(async () => {
    try {
        
        bot.launch();
        log.start(config.get('type'));

        await mongoose.connect(config.get('mongo_uri'));
        log.info('Connection to MongoDB established');

        process.once('SIGINT', () => {
            bot.stop('SIGINT');
            log.info('Bot stopped: SIGINT');
        });
        process.once('SIGTERM', () => {
            bot.stop('SIGTERM');
            log.info('Bot stopped: SIGTERM');
        });

    } catch (error) {
        log.error(`An error handled\n${error}`);
    }
})()