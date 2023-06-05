import { IDatabase } from "../../database/database.interface";
import { Telegraf, Context } from 'telegraf';
import { Event } from "../event.class";
import { IConfigService } from "../../config/config.interface";
import { IUtils } from "../../utils/utils.interface";
import signale from "signale";

export class StartCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly configService: IConfigService, private readonly utilsService: IUtils) {
        super(bot);
    }

    handle(): void {
        this.bot.start(async (ctx) => {
            let user = await this.databaseService.getUser(ctx.message.from.id);

            if (!user) {
                await this.databaseService.saveUser(ctx.message.from.id, 
                    ctx.message.from.username ??= 'none', 
                    ctx.message.from.first_name ??= ctx.message.from.username ??= 'none');

                user = await this.databaseService.getUser(ctx.message.from.id);
                if (!user) return;

                await ctx.replyWithHTML(`<b>Hi!</b> You've been granted <b>10</b> free requests\n` +
                    `<b>Premium</b> plan will costs <b>8$</b> per month and include unlimited requests\n\n` +
                    `👇 Here you can send me your questions in text or voice format, and I will answer them`);

                await ctx.telegram.sendMessage(this.configService.get('admin_tg_id'), `<b>User @${user?.username} [<code>${user?.telegramId}</code>] just started the bot\n\nListed: <code>${user.list}</code>\nTotal requests: <code>${user.requests}</code></b>`, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: this.utilsService.getManageButtons(user.list)
                    }
                });

                signale.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] started the bot`);
            } else {
                let startMessage = '';
                if (user.list === 'limited') {
                    startMessage = `<b>Hey,</b> I remember you, you have ${user.freeRequests} free requests\n\n` +
                    `👇 You can waste them below`
                } else if (user.list === 'black') {
                    startMessage = `<b>Hey,</b> I remember you, too bad, but you are blacklisted\n\n` +
                    `If you think it is a <b>mistake</b> - contact me at @jus1d`
                } else if (user.list === 'none') {
                    startMessage = `<b>Hey,</b> I remember you, but you aren't added to any list yet\n\n` +
                    `You can contact admins at @jus1d`
                } else {
                    startMessage = `<b>Hey,</b> I remember you, you are whitelisted and have unlimited requests\n\n` +
                    `👇 You can ask me anything below`
                }

                user = await this.databaseService.getUser(ctx.message.from.id);
                if (!user) return;

                await ctx.replyWithHTML(startMessage);
                signale.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] restarted the bot`);
            }
            this.databaseService.initConversation(ctx.message.from.id);
        });
    }
}