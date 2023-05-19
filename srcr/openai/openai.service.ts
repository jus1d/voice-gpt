import { IMessage } from "../../src/database/models/conversation.model";
import { IOpenAI } from "./openai.interface";

export class OpenAI implements IOpenAI {
    init(): void {
        throw new Error("Method not implemented.");
    }
    chat(messages: IMessage[]): Promise<string> {
        throw new Error("Method not implemented.");
    }
    transcript(mp3FileName: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    
}