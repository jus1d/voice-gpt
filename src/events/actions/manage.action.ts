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

            const messageTextWithHTML = await this.utilsService.getUserStatsText(Number(user.telegramId));
            
            ctx.editMessageText(messageTextWithHTML, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: this.utilsService.getManageButtons(user.list)
                }
            })
        });
    }
}