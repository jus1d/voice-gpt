import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class WhitelistCommand extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.command('whitelist', async (ctx) => {
            
        });
    }
}