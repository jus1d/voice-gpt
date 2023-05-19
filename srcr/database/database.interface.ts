import { IConversation } from "../../src/database/models/conversation.model";
import { IUser } from "../../src/database/models/user.model";

export interface IDatabase {
    init(): Promise<void>;
    saveUser(telegramId: number, username: string, fullname: string): Promise<boolean>;
    getUser(telegramId: number): Promise<IUser | null>;
    incrementRequestsCounter(): Promise<boolean>;
    decreaseFreeRequests(): Promise<boolean>;
    setFreeRequests(): Promise<boolean>;
    setUserList(): Promise<boolean>;
    setRequestedStatus(): Promise<boolean>;
    initConversation(): Promise<boolean>;
    saveConversation(): Promise<boolean>;
    updateConversation(): Promise<boolean>;
    getConversation(): Promise<IConversation | null>;
    getAllUsers(): Promise<IUser[]>;
    isAdmin(): Promise<boolean>;
}