import { IMessage } from "../../src/database/models/conversation.model";
import { ILogger } from "../logger/logger.interface";
import { Configuration, OpenAIApi } from "openai";
import { IOpenAI } from "./openai.interface";
import fs from 'fs';
import { IVoiceService } from "../voice/voice.interface";

export class OpenAI implements IOpenAI {
    openai: any;

    roles = {
        user: 'user',
        assistant: 'assistant',
        system: 'system'
    }

    constructor(apiKey: string, private readonly voiceService: IVoiceService, private readonly loggerService: ILogger) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async chat(messages: IMessage[]): Promise<string> {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: messages,
            });

            return response.data.choices[0].message;
        } catch (error) {
            this.loggerService.error(`Error with getting response from ChatGPT\n${error}`, true);
            return '';
        }
    }

    async transcript(mp3FileName: string): Promise<string> {
        try{
            const response = await this.openai.createTranscription(
                fs.createReadStream(`./voices/${mp3FileName}.mp3`),
                'whisper-1'
            );
            this.voiceService.removeFile(`./voices/${mp3FileName}.mp3`);
            return response.data.text;
        } catch (error) {
            this.loggerService.error(`Error with transcripting prompt from MP3 file\n${error}`, true);
            return '';
        }
    }
}