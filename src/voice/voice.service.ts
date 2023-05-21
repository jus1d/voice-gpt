import { ILogger } from "../logger/logger.interface";
import { IVoiceService } from "./voice.interface";
import installer from '@ffmpeg-installer/ffmpeg';
import { unlink } from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import axios from "axios";
import fs from 'fs';

export class VoiceService implements IVoiceService {
    constructor(private readonly loggerService: ILogger) {
        ffmpeg.setFfmpegPath(installer.path);

        try {
            if (!fs.existsSync('./voices')) {
                fs.mkdirSync('./voices', );
                this.loggerService.info('./voices directory created', true);
            }
        } catch (error) {
            this.loggerService.error('Error while creating ./voices directory', true);
        }
    }

    async removeFile(path: string): Promise<void> {
        try {
            await unlink(path);
        } catch (error) {
            console.log('Error with file remove');
        }
    }

    async downloadOggFile(downloadLink: string, name: string): Promise<void> {
        const response = await axios.get(downloadLink, { responseType: 'stream' });
        const path = `./voices/${name}.ogg`;

        response.data.pipe(fs.createWriteStream(path));

        return new Promise((resolve: any, reject) => {
            response.data.on('end', () => {
                resolve(path);
            });
            response.data.on('error', () => {
                reject();
            });
        });
    }
    async convertOggToMp3(name: string): Promise<void> {
        return new Promise((resolve: any, reject) => {
            ffmpeg()
                .input(`./voices/${name}.ogg`)
                .output(`./voices/${name}.mp3`)
                .on('end', () => {
                    resolve(name);
                    this.removeFile(`./voices/${name}.ogg`);
                })
                .on('error', (error) => {
                    console.log(`Error with converting ${name}.ogg file to MP3 format: ${error.message}`);
                    reject(error);
                }).run();
        });
    }
} 