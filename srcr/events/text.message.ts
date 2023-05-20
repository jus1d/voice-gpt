import { IDatabase } from "../database/database.interface";
import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { Event } from "./event.class";
import { IOpenAI } from "../openai/openai.interface";
import { ILogger } from "../logger/logger.interface";
import { IConversation } from "../database/models/conversation.model";
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { code } from 'telegraf/format';
import { Message } from 'typegram';
import mongoose from 'mongoose';
import { Md5 } from 'ts-md5';
import config from 'config';
import fs from 'fs';

export class TextMessage extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly openaiService: IOpenAI, private readonly loggerService: ILogger) {
        super(bot);
    }

    handle(): void {
        this.bot.on(message('text'), async (ctx) => {
            const user = await this.databaseService.getUser(ctx.message.from.id);
            if (!user) {
                return await ctx.reply('Please use /start command to start the bot');
            }

            let conversation: IConversation | null  = await this.databaseService.getConversation(ctx.message.from.id);
            if (!conversation) {
                await this.databaseService.initConversation(ctx.message.from.id);
            }
            conversation = await this.databaseService.getConversation(ctx.message.from.id);

            if (!conversation) return;

            if (user.list === 'limited') {
                if (user.freeRequests === 0) return ctx.reply('Your free requests are over\n\nClick below to send whitelist request to admins', Markup.inlineKeyboard([
                    Markup.button.callback("Request", "request_access")
                ]));
            } else if (user.list !== 'white') {
                this.loggerService.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request rejected. User not whitelisted`, true);
                return ctx.reply(`You are not whitelisted yet. Sorry!\n\n` + 
                    `👇 Click below to send whitelist request to admins`, 
                    Markup.inlineKeyboard([
                        Markup.button.callback("Request", "request_access")
                    ]));
            }

            this.loggerService.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request created from text message`, true);

            try {
                const message = await ctx.reply(code('Already processing your request, wait a bit'));
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                    
                conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: ctx.message.text });
                const gptResponse = await this.openaiService.chat(conversation.messages);
                if (!gptResponse) return ctx.reply('🚨 No response from ChatGPT. Try again later or use /new to create new conversation.');
                
                if (gptResponse.content) {
                    conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.Assistant, content: gptResponse.content });
                    await this.databaseService.updateConversation(ctx.message.from.id, conversation.messages);
                    await this.databaseService.incrementRequestsCounter(ctx.message.from.id);
                    if (user.list === 'limited') await this.databaseService.decreaseFreeRequests(ctx.message.from.id);
                        
                    ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                    ctx.reply(gptResponse.content);
                } else {
                    ctx.telegram.deleteMessage(ctx.message.from.id, message.message_id);
                    ctx.reply('🚨 No response from ChatGPT. Try again later or use /new to create new conversation.');
                }
            } catch (error) {
                this.loggerService.error(`Error with creating request. User: @${ctx.message.from.username} [${ctx.message.from.id}]\n${error}`, true);
                ctx.reply('🚨 There was an error in your query. Please try again later');
            }
        });
    }
}