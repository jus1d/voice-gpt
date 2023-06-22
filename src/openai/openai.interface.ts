import { IMessage } from "../database/models/conversation.model";

export interface IOpenAI {
    roles: { user: string, assistant: string, system: string };
    chat(messages: Array<IMessage>): Promise<{ role: string, content: string } | null>;
    transcript(mp3FileName: string): Promise<string>;
}