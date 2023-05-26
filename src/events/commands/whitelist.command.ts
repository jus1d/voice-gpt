import { IDatabase } from "../../database/database.interface";
import { ILogger } from "../../logger/logger.interface";
import { IUtils } from "../../utils/utils.interface";
import { Context, Telegraf } from "telegraf";
import { Event } from "../event.class";

export class WhitelistCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly loggerService: ILogger, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.command('whitelist', async (ctx) => {
            try {
                const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
                if (!isAdmin) return;
            
                const users = await this.databaseService.getAllUsers();
                const buttons = [];

                for (const user of users) {
                    buttons.push([{ text: `@${user.username} - ${user.requests} requests. List: ${user.list}`, callback_data: `manage:${user.telegramId}` }]);
                }

                ctx.replyWithHTML(`<b>Total ${users.length} whitelisted users:</b>`, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: buttons
                    }
                });
            } catch (error) {
                await ctx.reply('<b>🚨 Error while getting whitelisted users</b>', {
                    parse_mode: 'HTML'
                });
                this.loggerService.error(`Error while getting whitelisted users\n${error}`, true);
            }
        });
    }
}