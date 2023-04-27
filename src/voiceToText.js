import installer from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import axios from "axios";
import fs from 'fs';

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

    createMp3File(fileName) {
        ffmpeg()
            .input(`./voices/${fileName}.ogg`)
            .output(`./voices/${fileName}.mp3`)
            .on('end', () => {
                console.log(`${fileName}.ogg converted to ${fileName}.mp3`);
            })
            .on('error', (error) => {
                console.log(`Error with converting ${fileName}.ogg file to MP3 format: ${error.message}`);
            }).run();
    }

    convertMp3ToText(mp3FilePath) {

    }

}

export const vocieToText = new VoiceToText();