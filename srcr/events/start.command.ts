import { IDatabase } from "../database/database.interface";
import { Telegraf, Context } from 'telegraf';
import { Event } from "./event.class";

export class StartCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase) {
        super(bot);
    }

    handle(): void {
        this.bot.start(async (ctx) => {
            const user = await this.databaseService.getUser(ctx.message.from.id);

            console.log(user);
            
            ctx.replyWithHTML('<b>Hi</b>');
        });
    }
}