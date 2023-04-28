import { Configuration, OpenAIApi } from "openai";
import { logger as log } from "./logger.js";
import { removeFile } from './utils.js';
import config from 'config';
import fs from 'fs';

class OpenAI {
    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages
            });

            return response.data.choices[0].message;
        } catch (error) {
            log.error(`Error with getting response from ChatGPT\n${error}`);
        }
    }

    async transcript(mp3FileName) {
        try{
            const response = await this.openai.createTranscription(
                fs.createReadStream(`./voices/${mp3FileName}.mp3`),
                'whisper-1'
            );
            removeFile(`./voices/${mp3FileName}.mp3`);
            return response.data.text;
        } catch (error) {
            log.error('Error with transcripting prompt from MP3 file' + error.message);
        }
    }
}

export const openAI = new OpenAI(config.get("openai_token"));