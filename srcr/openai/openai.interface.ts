import { IMessage } from "../../src/database/models/conversation.model";

export interface IOpenAI {
    chat(messages: Array<IMessage>): Promise<{ role: string, content: string } | null>;
    transcript(mp3FileName: string): Promise<string>;
}