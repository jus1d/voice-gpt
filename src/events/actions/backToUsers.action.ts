import { IDatabase } from "../../database/database.interface";
import { IUtils } from "../../utils/utils.interface";
import { Telegraf, Context } from "telegraf";
import { Event } from "../event.class";

export class BackToUsersAction extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.action('back_to_users', async (ctx) => {
            const users = await this.databaseService.getWhitelistedUsers();
            let buttons = [];

            for (const user of users) {
                if (user.list === this.databaseService.list.limited) {
                    buttons.push([{ text: `@${user.username} - ${user.requests} requests. List: ${user.list}`, callback_data: `manage:${user.telegramId}` }]);
                } else {
                    buttons.push([{ text: `@${user.username} - ${user.requests} requests. List: ${user.list}`, callback_data: `manage:${user.telegramId}` }]);
                }
            }

            await ctx.editMessageText('<b>All whitelisted users:</b>', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        });
    }
}