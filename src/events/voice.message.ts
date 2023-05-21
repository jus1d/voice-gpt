import { IConversation } from "../database/models/conversation.model";
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { IDatabase } from "../database/database.interface";
import { IVoiceService } from "../voice/voice.interface";
import { Telegraf, Context, Markup } from 'telegraf';
import { IOpenAI } from "../openai/openai.interface";
import { ILogger } from "../logger/logger.interface";
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import { Event } from "./event.class";
import { Md5 } from 'ts-md5';

export class VoiceMessage extends Event {
    constructor(bot: Telegraf<Context>, private readonly databaseService: IDatabase, private readonly openaiService: IOpenAI, private readonly loggerService: ILogger, private readonly voiceService: IVoiceService) {
        super(bot);
    }

    handle(): void {
        this.bot.on(message('voice'), async (ctx) => {
            const user = await this.databaseService.getUser(ctx.message.from.id);
            if (!user) {
                return await ctx.reply(`<b>Hmm...</b> I don't remember you\n\n` + 
                    `Please use /start command to start the bot`);
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
            } else if (user.list !== this.databaseService.list.white) {
                this.loggerService.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request rejected. User not whitelisted`, true);
                return ctx.reply('You are not whitelisted yet. Sorry!\n\nClick below to send whitelist request to admins', Markup.inlineKeyboard([
                    Markup.button.callback("Request", "request_access")
                ]));
            }

            this.loggerService.info(`User @${ctx.message.from.username} [${ctx.message.from.id}] request created from voice message`, true);

            try {
                const message = await ctx.reply(code('Already processing your request, wait a bit'));
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
                const userId = String(ctx.message.from.id);
                const unixTime = String(Math.floor(Date.now() / 1000));
                const fileName = Md5.hashStr(`${userId}${unixTime}`);

                await this.voiceService.downloadOggFile(link.href, fileName);
                await this.voiceService.convertOggToMp3(fileName);

                const prompt = await this.openaiService.transcript(fileName);
                if (!prompt) return ctx.reply(`Your voice message is not recognized`);

                conversation.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: prompt });
                const gptResponse = await this.openaiService.chat(conversation.messages);
                
                if (gptResponse) {
                    conversation.messages.push({ role: 'assistant', content: gptResponse.content });
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