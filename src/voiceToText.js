import axios from "axios";
import installer from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { removeFile } from './utils.js';

class VoiceToText {

    constructor() {
        ffmpeg.setFfmpegPath(installer.path)
    }

    async createOggFile(url, fileName) {
        const response = await axios.get(url, {responseType: 'stream'});
        const path = `./voices/${fileName}.ogg`;

        response.data.pipe(fs.createWriteStream(path));
        
        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve(path);
            });

            response.data.on('error', (error) => {
                reject(error);
            });
        })
    }

    async createMp3File(fileName) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(`./voices/${fileName}.ogg`)
                .output(`./voices/${fileName}.mp3`)
                .on('end', () => {
                    removeFile(`./voices/${fileName}.ogg`);
                    resolve(fileName);
                })
                .on('error', (error) => {
                    console.log(`Error with converting ${fileName}.ogg file to MP3 format: ${error.message}`);
                    reject(error);
                }).run();
        });


    }

    convertMp3ToText(fileName) {

    }

}

export const vocieToText = new VoiceToText();