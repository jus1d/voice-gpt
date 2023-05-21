import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class ConversationAction extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('get_conversation', async (ctx) => {
            
        });
    }
}