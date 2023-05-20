import { IMessage } from "../../src/database/models/conversation.model";

export interface IOpenAI {
    chat(messages: Array<IMessage>): Promise<string>;
    transcript(mp3FileName: string): Promise<string>;
}