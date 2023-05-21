import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class UsersCommand extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.command('users', async (ctx) => {
            
        });
    }
}