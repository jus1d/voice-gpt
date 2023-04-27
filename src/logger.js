import consoleStamp from 'console-stamp';

const setConsoleStamp = (type) => {
    if (type === 'info') {
        consoleStamp(console, { format: '(->).cyan :date(HH:MM:ss).blue.underline' });
    } else if (type === 'error') {
        consoleStamp(console, { format: '(->).red :date(HH:MM:ss).blue.underline' });
    } else if (type === 'success') {
        consoleStamp(console, { format: '(->).green :date(HH:MM:ss).blue.underline' });
    }
}

class Logger {
    constructor() {}

    error(message) {
        setConsoleStamp('error');
        console.log(message);
        setConsoleStamp('info');
    }

    success(message) {
        setConsoleStamp('success');
        console.log(message);
        setConsoleStamp('info');
    }

    info(message) {
        setConsoleStamp('info');
        console.log(message);
    }

    usernameFormat(username) {
        return `\x1b[36m\x1b[4m${username}\x1b[0m`;
    }

    versionFormat(type) {
        if (type === 'prod') {
            return `\x1b[4m\x1b[36mVoiceGPT:production\x1b[0m`;
        } else if (type === 'dev') {
            return `\x1b[4m\x1b[36mVoiceGPT:development\x1b[0m`;
        } else {
            return `\x1b[4m\x1b[36mVoiceGPT\x1b[0m`;
        }
    }
}

export const logger = new Logger();