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
            if (!ctx.from) return;

            const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
            if (!isAdmin) return;

            await ctx.editMessageText(await this.utilsService.getUsersText(), {
                parse_mode: 'HTML'
            });
        });
    }
}