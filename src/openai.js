import { Configuration, OpenAIApi } from "openai";
import config from 'config';
import fs from 'fs';
import { removeFile } from './utils.js';

class OpenAI {
    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async chat() {}

    async transcript(mp3FileName) {
        try{
            const response = await this.openai.createTranscription(
                fs.createReadStream(`./voices/${mp3FileName}.mp3`),
                'whisper-1'
            );
            removeFile(`./voices/${mp3FileName}.mp3`)
            return response.data.text;
        } catch (error) {
            console.log('Error with transcripting prompt from MP3 file' + error.message)
        }
    }
}

export const openAI = new OpenAI(config.get("OPENAI_TOKEN"));