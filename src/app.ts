import { IConversation } from './database/models/conversation.model';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { IUser } from './database/models/user.model';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { mongo } from './database/mongo';
import { code } from 'telegraf/format';
import { voiceToText } from './voice';
import { Message } from 'typegram';
import { openAI } from './openai';
import mongoose from 'mongoose';
import { utils } from './utils';
import { log } from './logger';
import { Md5 } from 'ts-md5';
import config from 'config';
import fs from 'fs';

const bot = new Telegraf(config.get('telegram_token'));
const TYPE: string = config.get('type');
const packageFile = JSON.parse(fs.readFileSync('package.json').toString());

bot.command('start', async (ctx) => {
    const user = await mongo.getUser(ctx.message.from.id);

    if (!user) {
        await mongo.saveUser(ctx.message.from.id, ctx.message.from.username ??= '', ctx.message.from.first_name);
    }

    log.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] started the bot`);

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
        
        await ctx.replyWithHTML(await utils.getWhitelistText());
    } catch (error) {
        await ctx.reply('Error while getting whitelisted users');
        log.error(`Error while getting whitelisted users\n${error}`);
    }
});

bot.command('users', async (ctx) => {
    try {
        const isAdmin = await mongo.isAdmin(ctx.from.id);
        if (!isAdmin) return;
    
        await ctx.replyWithHTML(await utils.getUsersText());
    } catch (error) {
        await ctx.reply('Error while getting users');
        log.error(`Error while getting users\n${error}`);
    }
});

bot.hears(/\/manage@(\d+)/, async (ctx) => {
    const telegramId = Number(ctx.message.text.split('@')[1]);
    
    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    const user: IUser | null = await mongo.getUser(telegramId);
    if (!user) {
        await ctx.replyWithHTML(`<b>No user found with ID: <code>${telegramId}</code></b>`);
        return;
    }

    const messageTextWithHTML = await utils.getUserStatsText(telegramId);

    await ctx.replyWithHTML(messageTextWithHTML, {
        reply_markup: {
            inline_keyboard: utils.getManageButtons(user.list)
        }
    });
});

bot.command('new', async (ctx) => {
    await mongo.updateConversation(ctx.message.from.id, []);
    await ctx.replyWithHTML('<b>New chat created!</b>');
    log.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] created new chat context`);
});

bot.command('id', async (ctx) => {
    ctx.replyWithHTML(`<b>Your ID:</b> <code>${ctx.message.from.id}</code>`);
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

    if (user.list === mongo.list.limited) {
        if (user.freeRequests === 0) return ctx.reply('Your free requests are over\n\nClick below to send whitelist request to admins', Markup.inlineKeyboard([
            Markup.button.callback("Request", "request_access")
        ]));
    } else if (user.list !== mongo.list.white) {
        log.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request rejected. User not whitelisted`);
        return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins', Markup.inlineKeyboard([
            Markup.button.callback("Request", "request_access")
        ]));
    }

    log.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request created from voice message`);

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
            if (user.list === mongo.list.limited) await mongo.decreaseFreeRequests(ctx.message.from.id);
                
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply(gptResponse.content);
        } else {
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply('No response from ChatGPT. Try again later or use /new to create new conversation.');
        }
    } catch (error) {
        log.error(`Error with creating request. User: @${ctx.message.from.username} [${ctx.message.from.id}]\n${error}`);
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

    if (user.list === mongo.list.limited) {
        if (user.freeRequests === 0) return ctx.reply('Your free requests are over\n\nClick below to send whitelist request to admins', Markup.inlineKeyboard([
            Markup.button.callback("Request", "request_access")
        ]));
    } else if (user.list !== mongo.list.white) {
        log.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request rejected. User not whitelisted`);
        return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins', Markup.inlineKeyboard([
            Markup.button.callback("Request", "request_access")
        ]));
    }

    log.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request created from text message`);

    try {
        const message = await ctx.reply(code('Already processing your request, wait a bit'));
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
            
        conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: ctx.message.text });
        const gptResponse = await openAI.chat(conversation.messages);
        if (gptResponse) {
            conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.Assistant, content: gptResponse.content });
            await mongo.updateConversation(ctx.message.from.id, conversation.messages);
            await mongo.incrementRequestsCounter(ctx.message.from.id);
            if (user.list === mongo.list.limited) await mongo.decreaseFreeRequests(ctx.message.from.id);
                
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply(gptResponse.content);
        } else {
            ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
            ctx.reply('No response from ChatGPT. Try again later or use /new to create new conversation.');
        }
    } catch (error) {
        log.error(`Error with creating request. User: @${ctx.message.from.username} [${ctx.message.from.id}]\n${error}`);
        ctx.reply('There was an error in your query. Please try again later');
    }
});

bot.action('request_access', async (ctx) => {
    ctx.editMessageText('Request to be added to the whitelist has been sent to admins. Please wait a little while');
    
    if (!ctx.from) return;

    const userList = (await mongo.getUser(ctx.from.id))?.list;
    if (userList === mongo.list.black) {
        log.info(`User's @${ctx.from.username} [${ctx.from.id}] request was auto-rejected`);
        return;
    }
    
    log.info(`User @${ctx.from.username} [${ctx.from.id}] requested a whitelist slot`);

    ctx.telegram.sendMessage(config.get('admin_tg_id'), `<b>User @${ctx.from.username} [<code>${ctx.from.id}</code>] requested a whitelist slot</b>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Whitelist', callback_data: 'whitelist'},
                    { text: 'Limited', callback_data: 'limited'},
                    { text: 'Reject', callback_data: 'none'},
                ]
            ]
        }
    });
    await mongo.setRequestedStatus(ctx.from.id, true);
});

bot.action('whitelist', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));
    const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('@', '');

    await mongo.setUserList(userId, mongo.list.white);

    const user: IUser | null = await mongo.getUser(userId);
    if (!user) return;
    const messageTextWithHTML = await utils.getUserStatsText(userId);

    await ctx.editMessageText(messageTextWithHTML, {
        parse_mode: 'HTML', 
        reply_markup: {
            inline_keyboard: utils.getManageButtons(user.list)
        }
    });
    if (user.requested) {
        await ctx.telegram.sendMessage(userId, 'You have been whitelisted', {
            parse_mode: 'HTML'
        });
        await mongo.setRequestedStatus(userId, false);
    }
    log.info(`User @${username} [${userId}] was whitelisted`);
});

bot.action('limited', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));
    const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('@', '');

    await mongo.setUserList(userId, mongo.list.limited);
    
    const user: IUser | null = await mongo.getUser(userId);
    if (!user) return;

    const messageTextWithHTML = await utils.getUserStatsText(userId);

    await ctx.editMessageText(messageTextWithHTML, {
        parse_mode: 'HTML', 
        reply_markup: {
            inline_keyboard: utils.getManageButtons(user.list)
        }
    });
    if (user.requested) {
        await ctx.telegram.sendMessage(userId, 'You have been added to limited list', {
            parse_mode: 'HTML'
        });
        await mongo.setRequestedStatus(userId, false);
    }
    log.info(`User @${username} [${userId}] was added to limited list`);
});

bot.action('none', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));
    const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('@', '');

    await mongo.setUserList(userId, mongo.list.none);
    
    const user: IUser | null = await mongo.getUser(userId);
    if (!user) return;

    const messageTextWithHTML = await utils.getUserStatsText(userId);

    await ctx.editMessageText(messageTextWithHTML, {
        parse_mode: 'HTML', 
        reply_markup: {
            inline_keyboard: utils.getManageButtons(user.list)
        }
    });
    if (user.requested) {
        await ctx.telegram.sendMessage(userId, 'You have been removed from any list', {
            parse_mode: 'HTML'
        });
        await mongo.setRequestedStatus(userId, false);
    }
    log.info(`User @${username} [${userId}] was removed from any list`);
});

bot.action('blacklist', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));
    const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('@', '');

    await mongo.setUserList(userId, mongo.list.black);
    
    const user: IUser | null = await mongo.getUser(userId);
    if (!user) return;
    
    const messageTextWithHTML = await utils.getUserStatsText(userId);

    await ctx.editMessageText(messageTextWithHTML, {
        parse_mode: 'HTML', 
        reply_markup: {
            inline_keyboard: utils.getManageButtons(user.list)
        }
    });
    if (user.requested) {
        await ctx.telegram.sendMessage(userId, 'You have been blacklisted', {
            parse_mode: 'HTML'
        });
        await mongo.setRequestedStatus(userId, false);
    }
    log.info(`User @${username} [${userId}] was blacklisted`);
});

bot.action('reset_free_requests', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));
    const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('@', '');

    await mongo.setFreeRequests(userId);

    const user: IUser | null = await mongo.getUser(userId);
    if (!user) return;

    const messageTextWithHTML = await utils.getUserStatsText(userId);

    await ctx.editMessageText(messageTextWithHTML, {
        parse_mode: 'HTML', 
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Whitelist', callback_data: 'whitelist'},
                    { text: 'Reset' , callback_data: 'reset_free_requests' }
                ],
                [
                    { text: 'None', callback_data: 'none'},
                    { text: 'Reject', callback_data: 'reject'},
                    { text: 'Blacklist', callback_data: 'blacklist'},
                ]
            ]
        }
    });
    await ctx.telegram.sendMessage(userId, 'You received 10 free requests', {
        parse_mode: 'HTML'
    });
    log.info(`User @${username} [${userId}] was added to limited list`);
});

bot.action('back_to_users', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    await ctx.editMessageText(await utils.getUsersText(), {
        parse_mode: 'HTML'
    });
});

bot.action('update_stats', async (ctx) => {
    if (!ctx.from) return;

    const isAdmin = await mongo.isAdmin(ctx.from.id);
    if (!isAdmin) return;

    const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));

    const user: IUser | null = await mongo.getUser(userId);
    if (!user) return;

    await ctx.editMessageText(await utils.getUserStatsText(userId), {
        parse_mode: 'HTML', 
        reply_markup: {
            inline_keyboard: utils.getManageButtons(user.list)
        }
    });
});

(async () => {
    try {
        
        bot.launch();
        log.start(TYPE, packageFile.version);

        await mongoose.connect(config.get('mongo_uri'));
        log.info('Connection to MongoDB established');

        if (TYPE === 'prod') {
            bot.telegram.sendMessage(config.get('admin_tg_id'), 
                `<b><code>VoiceGPT:${TYPE} v${packageFile.version} just started</code></b>`, 
                { parse_mode: 'HTML' });
        }

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