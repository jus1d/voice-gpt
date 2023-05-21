import { IConversation } from "./models/conversation.model";
import { IMessage } from "./models/conversation.model";
import { IUser } from "./models/user.model";

interface IList {
    white: string,
    black: string,
    limited: string,
    none: string,
}

interface IRoles {
    admin: string, 
    user: string
}

export interface IDatabase {
    list: IList;
    roles: IRoles;
    init(): Promise<void>;
    saveUser(telegramId: number, username: string, fullname: string): Promise<boolean>;
    getUser(telegramId: number): Promise<IUser | null>;
    incrementRequestsCounter(telegramId: number): Promise<boolean>;
    decreaseFreeRequests(telegramId: number): Promise<boolean>;
    setFreeRequests(telegramId: number, amount: number): Promise<boolean>;
    setUserList(telegramId: number, list: string): Promise<boolean>;
    setRequestedStatus(telegramId: number, isRequested: boolean): Promise<boolean>;
    initConversation(telegramId: number): Promise<boolean>;
    saveConversation(telegramId: number, messages: Array<IMessage>): Promise<boolean>;
    updateConversation(telegramId: number, messages: Array<IMessage>): Promise<boolean>;
    getConversation(telegramId: number): Promise<IConversation | null>;
    getWhitelistedUsers(): Promise<IUser[]>;
    getAllUsers(): Promise<IUser[]>
    isAdmin(telegramId: number): Promise<boolean>;
}