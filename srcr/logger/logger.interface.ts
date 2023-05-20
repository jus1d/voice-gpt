export interface ILogger {
    init(): void;
    getFullDate(): string;
    info(message: string, toFile: boolean): void;
    warn(message: string, toFile: boolean): void;
    error(message: string, toFile: boolean): void;
    start(type: string, version: string): void;
    toFile(message: string): void;
}