import { Context, Telegraf } from "telegraf";
import { Event } from "../event.class";
import { IDatabase } from "../../database/database.interface";
import { IUtils } from "../../utils/utils.interface";

export class ManageAction extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.action(/manage:(\d+)/, async (ctx) => {
            const callback = ctx.match.input;
            const userId = callback.split(':')[1];

            const user = await this.databaseService.getUser(Number(userId));
            if (!user) return;

            let messageTextWithHTML = 
                `<b>User @${user?.username} [<code>${user?.telegramId}</code>] stats:</b>\n\n` + 
                `<b>Listed:</b> <code>${user?.list}</code>\n` + 
                `<b>Total requests:</b> <code>${user?.requests}</code>`;

            if (user?.list === this.databaseService.list.limited) messageTextWithHTML += `\n<b>Free requests:</b> <code>${user?.freeRequests}</code>`;
            if (user?.role === this.databaseService.roles.admin) messageTextWithHTML += `\n\n<b>Role:</b> <code>${user.role}</code>`;

            ctx.editMessageText(messageTextWithHTML, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: this.utilsService.getManageButtons(user.list)
                }
            })
        });
    }
}