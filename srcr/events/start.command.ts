import { IDatabase } from "../database/database.interface";
import { ILogger } from "../logger/logger.interface";
import { Telegraf, Context } from 'telegraf';
import { Event } from "./event.class";

export class StartCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly loggerService: ILogger) {
        super(bot);
    }

    handle(): void {
        this.bot.start(async (ctx) => {
            const user = await this.databaseService.getUser(ctx.message.from.id);

            let startMessage = '';
            if (!user) {
                await this.databaseService.saveUser(ctx.message.from.id, 
                    ctx.message.from.username ??= '', 
                    ctx.message.from.first_name);
                    
                startMessage = `<b>Hi!</b> You've been granted <b>10</b> free requests\n` +
                    `<b>Premium</b> plan will costs <b>8$</b> per month and include unlimited requests\n\n` +
                    `👇 Here you can send me your questions in text or voice format, and I will answer them`;
            } else {
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
            }
            await ctx.replyWithHTML(startMessage);

            this.loggerService.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] started the bot`, true);

            const conversation = await this.databaseService.getConversation(ctx.message.from.id);
            if (!conversation) {
                await this.databaseService.initConversation(ctx.message.from.id);
            }
        });
    }
}