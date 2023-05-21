import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class ConversationCommand extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.command('conversation', async (ctx) => {
            
        });

        this.bot.hears(/\/conversation@(\d+)/, async (ctx) => {
            
        });
    }
}