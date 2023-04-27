import { message } from 'telegraf/filters';
import { Telegraf } from "telegraf";
import config from 'config';
import { ogg } from './ogg.js'
import { vocieToText } from './voiceToText.js';

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.on(message('voice'), async (ctx) => {
    try {
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggFilePath = await vocieToText.createOggFile(link.href, userId);

        vocieToText.createMp3File(userId);

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