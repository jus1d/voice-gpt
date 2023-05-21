import { IDatabase } from "../../database/database.interface";
import { IUser } from "../../database/models/user.model";
import { ILogger } from "../../logger/logger.interface";
import { IUtils } from "../../utils/utils.interface";
import { Telegraf, Context } from "telegraf";
import { Event } from "../event.class";
import { Message } from "typegram";

export class ResetFreeRequestsAction extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly loggerService: ILogger, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.action('reset_free_requests', async (ctx) => {
            if (!ctx.from) return;

            const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
            if (!isAdmin) return;

            const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));
            const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('@', '');

            await this.databaseService.setFreeRequests(userId, 10);

            const user: IUser | null = await this.databaseService.getUser(userId);
            if (!user) return;

            const messageTextWithHTML = await this.utilsService.getUserStatsText(userId);

            await ctx.editMessageText(messageTextWithHTML, {
                parse_mode: 'HTML', 
                reply_markup: {
                    inline_keyboard: this.utilsService.getManageButtons(user.list)
                }
            });
            await ctx.telegram.sendMessage(userId, 'You received 10 free requests', {
                parse_mode: 'HTML'
            });
            this.loggerService.info(`User @${username} [${userId}] was added to limited list`, true);
        });
    }
}