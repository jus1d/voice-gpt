import { Telegraf, Context } from "telegraf";
import { Event } from "./event.class";

export class PlugAction extends Event {
    constructor(bot: Telegraf<Context>) {
        super(bot);
    }

    handle(): void {
        this.bot.action('plug', async (ctx) => {
            ctx.editMessageText(`<b>Functionality will be available in one of the next updates</b>`, {
                parse_mode: 'HTML'
            });
        });
    }
}