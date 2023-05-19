import { IVoiceService } from "./voice.interface";

export class VoiceService implements IVoiceService {
    removeFile(path: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    downloadOggFile(downloadLink: string, name: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    convertOggToMp3(name: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}