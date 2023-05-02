import dateFormat from 'dateformat';
import config from 'config';
import fs from 'fs';

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
        message = `[${this.getFullDate()}] [  INFO   ] ${message}`;

        console.log(message);
        if (toFile) this.toFile(message);
    }

    warn(message: string, toFile = true) {
        message = `[${this.getFullDate()}] [  WARN   ] ${message}`;

        console.log(message);
        if (toFile) this.toFile(message);
    }

    error(message: string, toFile = true) {
        message = `[${this.getFullDate()}] [  ERROR  ] ${message}`;

        console.log(message);
        if (toFile) this.toFile(message);
    }

    start(type: string) {
        let name = 'VoiceGPT';

        if (type === 'prod') {
            name += ':production';
        } else if (type === 'dev') {
            name += ':dev';
        }

        this.info(`${name} just started`);
    }

    toFile(message: string) {
        fs.appendFile(`logs/logs-${dateFormat(new Date(), 'dd-mm-yyyy')}-${config.get('type')}.txt`, message, (error) => {
            if (error) this.error(`Error while appending file with logs`, false);
        });
    }
}

export const log = new Logger();