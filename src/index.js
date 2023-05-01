import { Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters';
import { eventHandler } from "./events.js";
import { command } from "./commands.js";
import { logger as log } from "./logger.js";
import mongoose from 'mongoose';
import config from 'config';

console.clear();

const bot = new Telegraf(config.get('telegram_token'));
bot.use(session());

bot.command('start', async (ctx) => eventHandler.onStart(ctx));

bot.command('new', async (ctx) => command.onNewCommand(ctx));

bot.command('id', async (ctx) => command.onIdCommand(ctx));

bot.command('whitelist', async (ctx) => command.onWhitelistCommand(ctx));

bot.hears(/\/reject@(\d+)/, async (ctx) => command.onRejectCommand(ctx));

bot.on(message('voice'), async (ctx) => eventHandler.onVoiceMessage(ctx));

bot.on(message('text'), async (ctx) => eventHandler.onTextMessage(ctx));

bot.action('request_whitelist_slot', async (ctx) => eventHandler.onRequestCallback(ctx));

bot.action('approve', async (ctx) => eventHandler.onApproveCallback(ctx));

bot.action('reject', async (ctx) => eventHandler.onRejectCallback(ctx));

(async () => {
    try {
        bot.launch();
        
        log.start(config.get('type'));
        
        await mongoose.connect(config.get('mongo_uri'), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        log.info(`Connection to the database is set`);
        
        process.once('SIGINT', () => {
            bot.stop('SIGINT');
            log.error('Bot stopped: SIGINT');
        });
        process.once('SIGTERM', () => {
            bot.stop('SIGTERM');
            log.error('Bot stopped: SIGTERM');
        });
    } catch (error) {
        log.error(`An error handled: ${error.message}`);
    }
})()
