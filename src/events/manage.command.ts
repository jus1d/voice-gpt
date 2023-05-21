import { IDatabase } from "../database/database.interface";
import { IUser } from "../database/models/user.model";
import { IUtils } from "../utils/utils.interface";
import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";

export class ManageCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.hears(/\/manage@(\d+)/, async (ctx) => {
            const telegramId = Number(ctx.message.text.split('@')[1]);
    
            const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
            if (!isAdmin) return;

            const user: IUser | null = await this.databaseService.getUser(telegramId);
            if (!user) {
                await ctx.replyWithHTML(`<b>No user found with ID: <code>${telegramId}</code></b>`);
                return;
            }

            const messageTextWithHTML = await this.utilsService.getUserStatsText(telegramId);

            await ctx.replyWithHTML(messageTextWithHTML, {
                reply_markup: {
                    inline_keyboard: this.utilsService.getManageButtons(user.list)
                }
            });
        });
    }
}