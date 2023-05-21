import { IDatabase } from "../database/database.interface";
import { Context, Telegraf } from "telegraf";
import { Event } from "./event.class";
import { Message } from "typegram";

export class ConversationAction extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase) {
        super(bot);
    }

    handle(): void {
        this.bot.action('get_conversation', async (ctx) => {
            if (!ctx.from) return;

            const isAdmin = await this.databaseService.isAdmin(ctx.from.id);
            if (!isAdmin) return;

            const userId = Number((ctx.update.callback_query.message as Message.TextMessage).text.split(' ')[2].replace('[', '').replace(']', ''));

            const user = await this.databaseService.getUser(userId);
            if (!user) return ctx.replyWithHTML(`<b>No user found...</b>`);

            const conversation = await this.databaseService.getConversation(userId);
            if (!conversation || conversation.messages.length === 0) return ctx.replyWithHTML(`<b>User's @${user.username} [<code>${user.telegramId}</code>] is clear</b>`);

            let conversationMessage = '';

            for (let i = 0; i < conversation.messages.length; i++) {
                const message = conversation.messages[i];

                if (conversationMessage.length + message.content.length > 4096) break;  

                if (message.role === 'user') {
                    conversationMessage += `<b>- ${message.content}</b>\n\n`;
                } else {
                    conversationMessage += `- ${message.content}\n\n`;
                }
            }

            conversationMessage = `<b>User's @${user.username} [<code>${user.telegramId}</code>] conversation:</b>\n\n${conversationMessage}`
            if (conversationMessage.length > 4096) {
                conversationMessage = `<b>User's @${user.username} [<code>${user.telegramId}</code>] conversation is too long. This will be fixed in upcomig updates</b>`
                ctx.editMessageText(conversationMessage, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [ { text: 'Next page »', callback_data: 'plug' } ],
                            [ { text: '« Back to user', callback_data: 'update_stats' } ]
                        ]
                    }
                });
            } else {
                ctx.editMessageText(conversationMessage, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [ { text: '« Back to user', callback_data: 'update_stats' } ]
                        ]
                    }
                });
            }

        });
    }
}