export interface IVoiceService {
    removeFile(path: string): Promise<void>;
    downloadOggFile(downloadLink: string, name: string): Promise<void>;
    convertOggToMp3(name: string): Promise<void>;
}