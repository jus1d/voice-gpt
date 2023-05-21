import { IDatabase } from "../database/database.interface";
import { IUser } from "../database/models/user.model";
import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";
import { IOpenAI } from "../openai/openai.interface";

export class ConversationCommand extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly openaiService: IOpenAI) {
        super(bot);
    }

    handle(): void {
        this.bot.command('conversation', async (ctx) => {
            let conversationMessage = ``;
            const clearConversationMessage = `<b>Your conversation is clear</b>`;

            const conversation = await this.databaseService.getConversation(ctx.message.from.id);
            if (!conversation) return ctx.replyWithHTML(clearConversationMessage);
            
            for (let i = 0; i < conversation?.messages.length; i++) {
                const message = conversation.messages[i];

                if (message.role === this.openaiService.roles.user) {
                    conversationMessage += `<b>- ${message.content}</b>\n\n`
                } else if (message.role === this.openaiService.roles.assistant) {
                    conversationMessage += `- ${message.content}\n\n`;
                } else {
                    conversationMessage += `- <b>${message.role}:</b> ${message.content}\n\n`;
                }
            }

            if (conversationMessage === '') {
                conversationMessage = clearConversationMessage;
            }
            else {
                conversationMessage = '<b>Your conversation:\n\n</b>' + conversationMessage;
            }

            await ctx.replyWithHTML(conversationMessage);
        });

        this.bot.hears(/\/conversation@(\d+)/, async (ctx) => {
            const telegramId = Number(ctx.message.text.split('@')[1]);
    
            const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
            if (!isAdmin) return;

            const user: IUser | null = await this.databaseService.getUser(telegramId);
            if (!user) return await ctx.replyWithHTML(`<b>No user found with ID: <code>${telegramId}</code></b>`);

            const conversation = await this.databaseService.getConversation(telegramId);
            if (!conversation || conversation.messages.length === 0) return await ctx.replyWithHTML(`<b>User's @${user.username} [<code>${user.telegramId}</code>] is clear</b>`);

            let conversationMessage = '';

            for (let i = 0; i < conversation.messages.length; i++) {
                const message = conversation.messages[i];

                if (message.role === this.openaiService.roles.user) {
                    conversationMessage += `<b>- ${message.content}</b>\n\n`
                } else if (message.role === this.openaiService.roles.assistant) {
                    conversationMessage += `- ${message.content}\n\n`;
                } else {
                    conversationMessage += `- <b>${message.role}:</b> ${message.content}\n\n`;
                }
            }

            conversationMessage = `<b>User's @${user.username} [<code>${user.telegramId}</code>] conversation:</b>\n\n${conversationMessage}`

            ctx.replyWithHTML(conversationMessage);
        });
    }
}