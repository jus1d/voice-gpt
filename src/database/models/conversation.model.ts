import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { Schema, model } from "mongoose";

export interface IMessage {
    role: ChatCompletionRequestMessageRoleEnum,
    content: string
}

export interface IConversation {
    telegramId: string,
    username: string,
    messages: Array<IMessage>,
    date: Date
}

const conversationSchema = new Schema<IConversation>({
    telegramId: { type: String, required: true },
    username: { type: String, required: true },
    messages: [{ type: Object, required: true }],
    date: { type: Date, default: Date.now }
});

export const ConversationModel = model<IConversation>('Conversation', conversationSchema);