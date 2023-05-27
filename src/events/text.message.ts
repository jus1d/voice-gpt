import { IConversation } from "../database/models/conversation.model";
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { IDatabase } from "../database/database.interface";
import { IOpenAI } from "../openai/openai.interface";
import { ILogger } from "../logger/logger.interface";
import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { Event } from "./event.class";
import signale from "signale";

export class TextMessage extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly openaiService: IOpenAI, private readonly loggerService: ILogger) {
        super(bot);
    }

    handle(): void {
        this.bot.on(message('text'), async (ctx) => {
            const user = await this.databaseService.getUser(ctx.message.from.id);
            if (!user) {
                return await ctx.reply('<b>Please use /start command to start the bot</b>', {
                    parse_mode: 'HTML'
                });
            }

            let conversation = await this.databaseService.getConversation(ctx.message.from.id);
            if (!conversation) {
                await this.databaseService.initConversation(ctx.message.from.id);
            }
            conversation = await this.databaseService.getConversation(ctx.message.from.id);

            if (!conversation) return;

            if (user.list === this.databaseService.list.limited) {
                if (user.freeRequests === 0) return ctx.reply('<b>Your free requests are over</b>\n\nClick below to send whitelist request to admins', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Request', callback_data: 'request_access' }]
                        ]
                    }
                });
            } else if (user.list !== this.databaseService.list.white) {
                signale.info(`User's @${ctx.message.from.username} [${ctx.message.from.id}] request rejected. User not whitelisted`);
                return ctx.reply(`<b>You are not whitelisted yet. Sorry!</b>\n\n` + 
                    `👇 Click below to send whitelist request to admins`, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Request', callback_data: 'request_access' }]
                            ]
                        }
                    });
            }

            signale.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] created a request from text message`);

            try {
                const message = await ctx.reply('<code>Already processing your request, wait a bit</code>', { parse_mode: 'HTML'});
                ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                    
                conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: ctx.message.text });
                const gptResponse = await this.openaiService.chat(conversation.messages);
                if (!gptResponse) return ctx.reply('<b>🚨 No response from ChatGPT.</b> Try again later or use /new to create new conversation.', { 
                    parse_mode: 'HTML' 
                });

                if (gptResponse.content) {
                    conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.Assistant, content: gptResponse.content });
                    await this.databaseService.updateConversation(ctx.message.from.id, conversation.messages);
                    await this.databaseService.incrementRequestsCounter(ctx.message.from.id);
                    if (user.list === this.databaseService.list.limited) await this.databaseService.decreaseFreeRequests(ctx.message.from.id);
                        
                    ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                    ctx.reply(gptResponse.content);
                } else {
                    ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                    ctx.reply('<b>🚨 No response from ChatGPT.</b> Try again later or use /new to create new conversation.', { 
                        parse_mode: 'HTML' 
                    });
                }
            } catch (error) {
                signale.error(`Error with creating request. User: @${ctx.message.from.username} [${ctx.message.from.id}]\n${error}`);
                signale.fatal(error);
                ctx.reply('<b>🚨 There was an error in your query.</b> Please try again later', {
                    parse_mode: 'HTML'
                });
            }
        });
    }
}