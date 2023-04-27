import { message } from 'telegraf/filters';
import { Telegraf, Markup, session } from "telegraf";
import crc32 from 'crc32';
import config from 'config';
import { vocieToText } from './voiceToText.js';
import { openAI } from './openai.js';
import { whitelist } from './whitelist.js';

const INITIAL_SESSION = {
    messages: [],
};

const bot = new Telegraf(config.get('telegram_token'));
const whiteList = config.get('white_list').map(user => user.userId);

bot.use(session());

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply('Hi! You can send me your questions, and I will reply to them!\n\nbtw: Voice messages supports too');
});

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply('New chat created!');
});

bot.command('id', async (ctx) => {
    ctx.reply(String(ctx.message.from.id));
});

bot.on(message('voice'), async (ctx) => {
    if (!whiteList.includes(ctx.message.from.id)) {
        return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins 👇', Markup.inlineKeyboard([
            Markup.button.callback("Request", "request_whitelist_slot")
        ]));
    }

    ctx.session ??= INITIAL_SESSION;
    try {
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

        ctx.session.messages.push({ role: 'assistant', content: gptResponse.content });

        ctx.reply(gptResponse.content);
    } catch (error) {
        console.log(error);
    }
});

bot.on(message('text'), async (ctx) => {
    if (!whiteList.includes(ctx.message.from.id)) {
        return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins 👇', Markup.inlineKeyboard([
            Markup.button.callback("Request", "request_whitelist_slot")
        ]));
    }

    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        ctx.session.messages.push({ role: 'user', content: ctx.message.text });
        const gptResponse = await openAI.chat(ctx.session.messages);
        ctx.session.messages.push({ role: 'assistant', content: gptResponse.content });
        ctx.reply(gptResponse.content);
    } catch (error) {
        console.log(error);
    }
});

bot.action('request_whitelist_slot', async (ctx) => {
    ctx.editMessageText('Request to be added to the whitelist has been sent to admins. Please wait a little whle');

    ctx.telegram.sendMessage(797712297, `@${ctx.from.username} [${ctx.from.id}] requested a whitelist slot`, Markup.inlineKeyboard([
        Markup.button.callback("✅ Allow", "allow"),
        Markup.button.callback("❌ Reject", "reject")
    ]));
});

bot.action('allow', async (ctx) => {
    const userId = Number(ctx.update.callback_query.message.text.split(' ')[1].replace('[', '').replace(']', ''));
    const username = ctx.update.callback_query.message.text.split(' ')[0].replace('@', '');

    const user = {
        userId: userId,
        username: username,
        role: 'user',
        balance: 10
    };

    const res = whitelist.addUser(user);

    if (res) {
        ctx.telegram.sendMessage(userId, '🥳 Your request to be added to the whitelist has been approved by the admins.\n\nYou are whitelisted and can use the bot! Just send text message or record voice');
        ctx.editMessageText(`✅ Access for @${username} was granted`);
    } else {
        ctx.editMessageText(`❌ Something went wrong while granting access to @${username}`);
    }

});

bot.action('reject', async (ctx) => {
    const userId = Number(ctx.update.callback_query.message.text.split(' ')[1].replace('[', '').replace(']', ''));
    const username = ctx.update.callback_query.message.text.split(' ')[0].replace('@', '');

    ctx.editMessageText(`❌ Access for @${username} was rejected`);
    ctx.telegram.sendMessage(userId, '❌ Your request to be added to the whitelist was rejected by the admins');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));