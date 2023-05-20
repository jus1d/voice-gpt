import { IDatabase } from "../database/database.interface";
import { Event } from "./event.class";
import { Telegraf, Context } from 'telegraf';

export class StartCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase) {
        super(bot);
    }

    handle(): void {
        this.bot.start(async (ctx) => {
            const user = await this.databaseService.getUser(ctx.message.from.id);
            
            ctx.replyWithHTML('<b>Hi</b>');
        });
    }
}