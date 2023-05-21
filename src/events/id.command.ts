import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class IdCommand extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.command('id', async (ctx) => {
            ctx.replyWithHTML(`<b>Your ID:</b> <code>${ctx.message.from.id}</code>`);
        });
    }
}