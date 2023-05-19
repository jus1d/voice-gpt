import { IDatabase } from "../database/database.interface";
import { Command } from "./command.class";
import { Telegraf, Context } from 'telegraf';

export class StartCommand extends Command {
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