import { IDatabase } from "../../database/database.interface";
import { IUser } from "../../database/models/user.model";
import { IUtils } from "../../utils/utils.interface";
import { Telegraf, Context } from "telegraf";
import { Event } from "../event.class";
import { Message } from 'typegram';
import signale from "signale";

export class BlacklistAction extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.action('blacklist', async (ctx) => {
            if (!ctx.from) return;

            const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
            if (!isAdmin) return;

            const userId = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', '');
            const username = (ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[1].replace('@', '');

            await this.databaseService.setUserList(userId, this.databaseService.list.black);
            
            const user: IUser | null = await this.databaseService.getUser(userId);
            if (!user) return;
            
            const messageTextWithHTML = await this.utilsService.getUserStatsText(userId);

            await ctx.editMessageText(messageTextWithHTML, {
                parse_mode: 'HTML', 
                reply_markup: {
                    inline_keyboard: this.utilsService.getManageButtons(user.list)
                }
            });
            if (user.requested) {
                await ctx.telegram.sendMessage(userId, 'You have been blacklisted', {
                    parse_mode: 'HTML'
                });
                await this.databaseService.setRequestedStatus(userId, false);
            }
            signale.success(`User @${username} [${userId}] was blacklisted`);
        });
    }
}