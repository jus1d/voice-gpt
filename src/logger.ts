import dateFormat from 'dateformat';
import config from 'config';
import fs from 'fs';

const start_symbol = '❯';

const reset = "\x1b[0m";
const underscore = "\x1b[4m";
const dim = "\x1b[2m";
const red = "\x1b[31m";
const cyan = "\x1b[36m";
const yellow = "\x1b[33m";
const magenta = "\x1b[35m";

class Logger {
    constructor() {
        try {
            if (!fs.existsSync('./logs')) {
                fs.mkdirSync('./logs', );
                this.info('./logs directory created');
            }
        } catch (error) {
            this.error('Error while creating ./logs directory');
        }
    }

    private getFullDate() {
        const date = new Date();
        return dateFormat(date, 'dd.mm HH:MM:ss');
    }

    info(message: string, toFile = true) {
        console.log(`${dim}${start_symbol}${reset} ${magenta}[${this.getFullDate()}] ${cyan}[  INFO   ]${reset} ${message}`);
        if (toFile) this.toFile(`[${this.getFullDate()}] [  INFO   ] ${message}`);
    }

    warn(message: string, toFile = true) {
        console.log(`${dim}${start_symbol}${reset} ${magenta}[${this.getFullDate()}] ${yellow}[  WARN   ]${reset} ${message}`);
        if (toFile) this.toFile(`[${this.getFullDate()}] [  WARN   ] ${message}`);
    }

    error(message: string, toFile = true) {
        console.log(`${red}${start_symbol}${reset} ${magenta}[${this.getFullDate()}] ${red}[  ERROR  ]${reset} ${message}`);
        if (toFile) this.toFile(`[${this.getFullDate()}] [  ERROR  ] ${message}`);
    }

    start(type: string, version: string) {
        this.info(`${underscore}${cyan}VoiceGPT:${type}${reset}${dim} v${version}${reset} just started`, false);
    }

    toFile(message: string) {
        fs.appendFile(`logs/logs-${dateFormat(new Date(), 'dd-mm-yyyy')}-${config.get('type')}.txt`, message, (error) => {
            if (error) this.error(`Error while appending file with logs`, false);
        });
    }
}

export const log = new Logger();