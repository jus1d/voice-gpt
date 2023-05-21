import { IConfigService } from "../config/config.interface";
import { IDatabase } from "../database/database.interface";
import { ILogger } from "../logger/logger.interface";
import { Telegraf, Context } from "telegraf";
import { Event } from "./event.class";

export class RequestAccess extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly configService: IConfigService, private readonly loggerService: ILogger) {
        super(bot);
    }

    handle(): void {
        this.bot.action('request_access', async (ctx) => {
            ctx.editMessageText('Request to be added to the whitelist has been sent to admins. Please wait a little while');
            
            if (!ctx.from) return;

            const userList = (await this.databaseService.getUser(ctx.from.id))?.list;
            if (userList === this.databaseService.list.black) {
                return this.loggerService.info(`User's @${ctx.from.username} [${ctx.from.id}] request was auto-rejected`, true);
            }
            
            this.loggerService.info(`User @${ctx.from.username} [${ctx.from.id}] requested a whitelist slot`, true);

            ctx.telegram.sendMessage(this.configService.get('admin_tg_id'), `<b>User @${ctx.from.username} [<code>${ctx.from.id}</code>] requested a whitelist slot</b>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Whitelist', callback_data: 'whitelist'},
                            { text: 'Limited', callback_data: 'limited'},
                            { text: 'Reject', callback_data: 'none'},
                        ]
                    ]
                }
            });
            await this.databaseService.setRequestedStatus(ctx.from.id, true);
        });
    }
}