import { ConversationModel, IConversation, IMessage } from "./models/conversation.model";
import { UserModel, IUser } from "./models/user.model";
import { IDatabase } from "./database.interface";
import mongoose from 'mongoose';

export class DatabaseService implements IDatabase {
    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    saveUser(telegramId: number, username: string, fullname: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getUser(telegramId: number): Promise<IUser | null> {
        throw new Error("Method not implemented.");
    }
    incrementRequestsCounter(telegramId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    decreaseFreeRequests(telegramId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    setFreeRequests(telegramId: number, amount: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    setUserList(telegramId: number, list: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    setRequestedStatus(telegramId: number, isRequested: boolean): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    initConversation(telegramId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    saveConversation(telegramId: number, messages: IMessage[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    updateConversation(telegramId: number, messages: IMessage[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getConversation(telegramId: number): Promise<IConversation | null> {
        throw new Error("Method not implemented.");
    }
    getWhitelistedUsers(): Promise<IUser[]> {
        throw new Error("Method not implemented.");
    }
    getAllUsers(): Promise<IUser[]> {
        throw new Error("Method not implemented.");
    }
    isAdmin(telegramId: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}