import { message } from 'telegraf/filters';
import { Telegraf, session } from "telegraf";
import crc32 from 'crc32';
import config from 'config';
import { vocieToText } from './voiceToText.js';
import { openAI } from './openai.js';

const INITIAL_SESSION = {
    messages: [],
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.use(session());

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('New chat created!');
});

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Hi! You can send me text or voice messages, and I will reply to them!');
});

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);

        const userId = String(ctx.message.from.id);
        const unixTime = String(Math.floor(Date.now() / 1000));
        const hash = crc32(`${unixTime}${ctx.message.id}`).toString(16);

        const fileName = `${userId}_${hash}`
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

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));