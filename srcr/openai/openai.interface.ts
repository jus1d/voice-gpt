import { IMessage } from "../../src/database/models/conversation.model";

export interface IOpenAI {
    init(): void;
    chat(messages: Array<IMessage>): Promise<string>;
    transcript(mp3FileName: string): Promise<string>;
}