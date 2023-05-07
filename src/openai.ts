import { IMessage } from "./database/models/conversation.model";
import { Configuration, OpenAIApi } from "openai";
import { removeFile } from "./voice";
import { log } from "./logger";
import config from 'config';
import fs from 'fs';

class OpenAI {
    openai: any;

    roles = {
        user: 'user',
        assistant: 'assistant',
        system: 'system'
    }
    
    constructor(apiKey: string) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async chat(messages: Array<IMessage>) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: messages,
            });

            return response.data.choices[0].message;
        } catch (error) {
            log.error(`Error with getting response from ChatGPT\n${error}`);
        }
    }

    async transcript(mp3FileName: string) {
        try{
            const response = await this.openai.createTranscription(
                fs.createReadStream(`./voices/${mp3FileName}.mp3`),
                'whisper-1'
            );
            removeFile(`./voices/${mp3FileName}.mp3`);
            return response.data.text;
        } catch (error) {
            log.error(`Error with transcripting prompt from MP3 file\n${error}`);
        }
    }
}

export const openAI = new OpenAI(config.get("openai_token"));