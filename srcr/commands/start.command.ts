import { Command } from "./command.class";
import { Telegraf, Context } from 'telegraf';

export class StartCommand extends Command {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.start(async (ctx) => {
            ctx.reply('Hi');
        });
    }
}