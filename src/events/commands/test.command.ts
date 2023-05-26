import { Context, Telegraf } from "telegraf";
import { Event } from "../event.class";
import { IDatabase } from "../../database/database.interface";
import { IUtils } from "../../utils/utils.interface";

export class TestCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly db: IDatabase, private readonly utils: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.command('test_users', async (ctx) => {
            const users = await this.db.getWhitelistedUsers();
            let buttons = [];

            for (const user of users) {
                if (user.list === this.db.list.limited) {
                    buttons.push([{ text: `@${user.username} - ${user.requests}/10 requests`, callback_data: `manage:${user.telegramId}` }]);
                }
                else {
                    buttons.push([{ text: `@${user.username} - ${user.requests} requests`, callback_data: `manage:${user.telegramId}` }]);
                }
            }

            await ctx.reply('All whitelisted users:', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        });

        this.bot.action(/manage:(\d+)/, async (ctx) => {
            const callback = ctx.match.input;
            const userId = callback.split(':')[1];

            const user = await this.db.getUser(Number(userId));
            if (!user) return;

            let messageTextWithHTML = 
                `<b>User @${user?.username} [<code>${user?.telegramId}</code>] stats:</b>\n\n` + 
                `<b>Listed:</b> <code>${user?.list}</code>\n` + 
                `<b>Total requests:</b> <code>${user?.requests}</code>`;

            if (user?.list === this.db.list.limited) messageTextWithHTML += `\n<b>Free requests:</b> <code>${user?.freeRequests}</code>`;
            if (user?.role === this.db.roles.admin) messageTextWithHTML += `\n\n<b>Role:</b> <code>${user.role}</code>`;

            ctx.editMessageText(messageTextWithHTML, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: this.utils.getManageButtons(user.list)
                }
            })
        });
    }
}