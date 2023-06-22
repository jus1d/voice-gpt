import { IMessage } from "../database/models/conversation.model";
import { Configuration, OpenAIApi } from "openai";
import { IOpenAI } from "./openai.interface";
import fs from 'fs';
import { IVoiceService } from "../voice/voice.interface";
import signale from "signale";

export class OpenAI implements IOpenAI {
    openai: any;

    roles = {
        user: 'user',
        assistant: 'assistant',
        system: 'system'
    }

    constructor(apiKey: string, private readonly voiceService: IVoiceService) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }
    async chat(messages: IMessage[]): Promise<{ role: string, content: string } | null> {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: messages,
            });

            return response.data.choices[0].message;
        } catch (error) {
            // this.loggerService.error(`Error with getting response from ChatGPT\n${error}`, true);
            signale.error('Error with getting response from ChatGPT');
            signale.fatal(error);
            return null;
        }
    }
    async transcript(mp3FileName: string): Promise<string> {
        try {
            const response = await this.openai.createTranscription(
                fs.createReadStream(`./voices/${mp3FileName}.mp3`),
                'whisper-1'
            );
            await this.voiceService.removeFile(`./voices/${mp3FileName}.mp3`);
            return response.data.text;
        } catch (error) {
            // this.loggerService.error(`Error with transcripting prompt from MP3 file\n${error}`, true);
            signale.error('Error with transcription prompt from MP3 file');
            signale.fatal(error);
            return '';
        }
    }
}