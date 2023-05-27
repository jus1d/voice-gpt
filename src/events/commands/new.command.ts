import { IDatabase } from "../../database/database.interface";
import { Context, Telegraf } from "telegraf";
import { Event } from "../event.class";
import signale from "signale";

export class NewCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase) {
        super(bot);
    }

    handle(): void {
        this.bot.command('new', async (ctx) => {
            await this.databaseService.updateConversation(ctx.message.from.id, []);
            await ctx.replyWithHTML('<b>New chat context created!</b>');
            signale.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] created new chat context`);
        });
    }
}