import { message } from 'telegraf/filters';
import { Telegraf } from "telegraf";
import config from 'config';
import { vocieToText } from './voiceToText.js';
import crc32 from 'crc32';

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.on(message('voice'), async (ctx) => {
    try {
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const unixTime = String(Math.floor(Date.now() / 1000));
        const hash = crc32(unixTime).toString(16);

        const fileName = `${userId}_${hash}`
        await vocieToText.createOggFile(link.href, fileName);

        vocieToText.createMp3File(fileName);

    } catch (error) {
        console.log(error);
    }
});

bot.command('start', async (ctx) => {
    ctx.reply('Bot started!');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));