import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class ManageCommand extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.hears(/\/manage@(\d+)/, async (ctx) => {
            
        });
    }
}