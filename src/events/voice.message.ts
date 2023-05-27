import { IConversation } from "../database/models/conversation.model";
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { IDatabase } from "../database/database.interface";
import { IVoiceService } from "../voice/voice.interface";
import { Telegraf, Context, Markup } from 'telegraf';
import { IOpenAI } from "../openai/openai.interface";
import { ILogger } from "../logger/logger.interface";
import { message } from 'telegraf/filters';
import { Event } from "./event.class";
import { Md5 } from 'ts-md5';
import signale from "signale";

export class VoiceMessage extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly openaiService: IOpenAI, private readonly loggerService: ILogger, private readonly voiceService: IVoiceService) {
        super(bot);
    }

    handle(): void {
        this.bot.on(message('voice'), async (ctx) => {
            const user = await this.databaseService.getUser(ctx.message.from.id);
            if (!user) {
                return await ctx.reply('<b>Please use /start command to start the bot</b>', {
                    parse_mode: 'HTML'
                });
            }

            let conversation: IConversation | null  = await this.databaseService.getConversation(ctx.message.from.id);
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

            signale.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] created a request from voice message`);

            try {
                const message = await ctx.reply('<code>Already processing your request, wait a bit</code>', {
                    parse_mode: 'HTML'
                });
                ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
                const userId = String(ctx.message.from.id);
                const unixTime = String(Math.floor(Date.now() / 1000));
                const fileName = Md5.hashStr(`${userId}${unixTime}`);

                await this.voiceService.downloadOggFile(link.href, fileName);
                await this.voiceService.convertOggToMp3(fileName);

                const prompt = await this.openaiService.transcript(fileName);
                if (!prompt) return ctx.reply(`<b>🚨 Your voice message is not recognized</b>`, {
                    parse_mode: 'HTML'
                });

                conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: prompt });
                const gptResponse = await this.openaiService.chat(conversation.messages);
                
                if (gptResponse) {
                    conversation.messages.push({ role: 'assistant', content: gptResponse.content });
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