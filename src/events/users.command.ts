import { IDatabase } from "../database/database.interface";
import { ILogger } from "../logger/logger.interface";
import { IUtils } from "../utils/utils.interface";
import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class UsersCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly loggerService: ILogger, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.command('users', async (ctx) => {
            try {
                const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
                if (!isAdmin) return;
            
                await ctx.replyWithHTML(await this.utilsService.getUsersText());
            } catch (error) {
                await ctx.reply('🚨 Error while getting users');
                this.loggerService.error(`Error while getting users\n${error}`, true);
            }
        });
    }
}