import { IDatabase } from "../../database/database.interface";
import { ILogger } from "../../logger/logger.interface";
import { Context, Telegraf } from "telegraf";
import { Event } from "../event.class";

export class NewCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly loggerService: ILogger) {
        super(bot);
    }

    handle(): void {
        this.bot.command('new', async (ctx) => {
            await this.databaseService.updateConversation(ctx.message.from.id, []);
            await ctx.replyWithHTML('<b>New chat context created!</b>');
            this.loggerService.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] created new chat context`, true);
        });
    }
}