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
}

export const logger = new Logger();