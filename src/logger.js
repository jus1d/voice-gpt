import fs from 'fs';
import dateFormat from 'dateformat';
import config from 'config';

const reset = "\x1b[0m";
const underscore = "\x1b[4m";
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const dim = "\x1b[2m";
const red = "\x1b[31m";
const blue = "\x1b[34m";
const yellow = "\x1b[33m";
const magenta = "\x1b[35m";

class Logger {
    constructor() {}

    getFullDate() {
        const date = new Date();
        return dateFormat(date, 'dd.mm HH:MM:ss');
    }

    file(message, logType) {
        const date = dateFormat(new Date(), 'dd-mm-yyyy');
        let type = '';
        if (logType === 'error') {
            type = '  ERROR  ';
        } else if (logType === 'success') {
            type = ' SUCCESS ';
        } else if (logType === 'info') {
            type = '  INFO   ';
        } else {
            type = '  NONE   ';
        }
        fs.appendFile(`logs/logs-${date}-${config.get('type')}.txt`, `[${this.getFullDate()}] [${type}] ${message}\n`, (error) => {
            if (error) {
                console.log(error);
            }
        });
    }

    error(message) {
        console.log(`${dim}❯${reset} ${magenta}[${this.getFullDate()}]${reset} ${red}[  ERROR  ]${reset} ${message}`);
        this.file(message, 'error');
    }

    success(message) {
        console.log(`${dim}❯${reset} ${magenta}[${this.getFullDate()}]${reset} ${green}[ SUCCESS ]${reset} ${message}`);
        this.file(message, 'success');
    }

    info(message) {
        console.log(`${dim}❯${reset} ${magenta}[${this.getFullDate()}]${reset} ${cyan}[  INFO   ]${reset} ${message}`);
        this.file(message, 'info');
    }

    start(type) {
        if (type === 'prod') {
            console.log(`${dim}❯${reset} ${magenta}[${this.getFullDate()}]${reset} ${cyan}[  INFO   ]${reset} ${underscore}${cyan}VoiceGPT:production${reset} started`);
            this.file(`VoiceGPT:production started`);
        } else if (type === 'dev') {
            console.log(`${dim}❯${reset} ${magenta}[${this.getFullDate()}]${reset} ${cyan}[  INFO   ]${reset} ${underscore}${cyan}VoiceGPT:development${reset} started`);
            this.file(`VoiceGPT:development started`);
        } else {
            console.log(`${dim}❯${reset} ${magenta}[${this.getFullDate()}]${reset} ${cyan}[  INFO   ]${reset} ${underscore}${cyan}VoiceGPT${reset} started`);
            this.file(`VoiceGPT started`);
        }
    }
}

export const logger = new Logger();