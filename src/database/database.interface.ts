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
    saveUser(telegramId: number | string, username: string, fullname: string): Promise<boolean>;
    getUser(telegramId: number | string): Promise<IUser | null>;
    incrementRequestsCounter(telegramId: number | string): Promise<boolean>;
    decreaseFreeRequests(telegramId: number | string): Promise<boolean>;
    setFreeRequests(telegramId: number | string, amount: number): Promise<boolean>;
    setUserList(telegramId: number | string, list: string): Promise<boolean>;
    setRequestedStatus(telegramId: number | string, isRequested: boolean): Promise<boolean>;
    initConversation(telegramId: number | string): Promise<boolean>;
    saveConversation(telegramId: number | string, messages: Array<IMessage>): Promise<boolean>;
    updateConversation(telegramId: number | string, messages: Array<IMessage>): Promise<boolean>;
    getConversation(telegramId: number | string): Promise<IConversation | null>;
    getOrInitConversation(telegramId: number | string): Promise<IConversation | null>;
    getWhitelistedUsers(): Promise<IUser[]>;
    getAllUsers(): Promise<IUser[]>
    isAdmin(telegramId: number | string): Promise<boolean>;
}