import { IDatabase } from "../../database/database.interface";
import { IUser } from "../../database/models/user.model";
import { IUtils } from "../../utils/utils.interface";
import { Telegraf, Context } from "telegraf";
import { Event } from "../event.class";
import { Message } from "typegram";

export class UpdateStatsAction extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.action('update_stats', async (ctx) => {
            if (!ctx.from) return;

            const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
            if (!isAdmin) return;

            const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));

            const user: IUser | null = await this.databaseService.getUser(userId);
            if (!user) return;

            const messageTextWithHTML = await this.utilsService.getUserStatsText(userId);

            try {
                await ctx.editMessageText(messageTextWithHTML, {
                    parse_mode: 'HTML', 
                    reply_markup: {
                        inline_keyboard: this.utilsService.getManageButtons(user.list)
                    }
                });
            } catch (error) {
                await ctx.editMessageText(messageTextWithHTML + '\n\n<code>Updated</code>', {
                    parse_mode: 'HTML', 
                    reply_markup: {
                        inline_keyboard: this.utilsService.getManageButtons(user.list)
                    }
                });
            }
        });
    }
}