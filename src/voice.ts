import installer from '@ffmpeg-installer/ffmpeg';
import { log } from './logger/logger';
import { unlink } from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import axios from "axios";
import fs from 'fs';

export const removeFile = async (path: string) => {
    try {
        await unlink(path);
    } catch (error) {
        console.log('Error with file remove');
    }
}

class VoiceToText {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);

        try {
            if (!fs.existsSync('./voices')) {
                fs.mkdirSync('./voices', );
                log.info('./voices directory created');
            }
        } catch (error) {
            log.error('Error while creating ./voices directory');
        }
    }

    async downloadOggFile(downloadLink: string, name: string) {
        const response = await axios.get(downloadLink, { responseType: 'stream' });
        const path = `./voices/${name}.ogg`;

        response.data.pipe(fs.createWriteStream(path));

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve(path);
            });

            response.data.on('error', () => {
                reject();
            });
        });
    }

    async convertOggToMp3(name: string) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(`./voices/${name}.ogg`)
                .output(`./voices/${name}.mp3`)
                .on('end', () => {
                    this.removeFile(`./voices/${name}.ogg`);
                    resolve(name);
                })
                .on('error', (error) => {
                    console.log(`Error with converting ${name}.ogg file to MP3 format: ${error.message}`);
                    reject(error);
                }).run();
        });
    }

    async removeFile(path: string) {
        try {
            await unlink(path);
        } catch (error) {
            console.log('Error with file remove');
        }
    }
}

export const voiceToText = new VoiceToText();