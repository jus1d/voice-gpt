import { ConversationModel, IConversation, IMessage } from "./models/conversation.model";
import { UserModel, IUser } from "./models/user.model";
import { IDatabase } from "./database.interface";
import mongoose from 'mongoose';
import { IConfigService } from "../config/config.interface";
import { ILogger } from "../logger/logger.interface";

export class DatabaseService implements IDatabase {
    list = {
        white: 'white',
        black: 'black',
        limited: 'limited',
        none: 'none'
    }

    roles = {
        admin: 'admin',
        user: 'user'
    }

    constructor(private readonly configService: IConfigService, private readonly loggerService: ILogger) { }

    async init(): Promise<void> {
        await mongoose.connect(this.configService.get('mongo_uri'));
        this.loggerService.info('Connection to MongoDB established', true);
    }
    async saveUser(telegramId: number, username: string, fullname: string): Promise<boolean> {
        try {
            await new UserModel({
                telegramId,
                username: username || '',
                fullname,
                role: 'user',
            }).save();
            return true;
        } catch (error) {
            this.loggerService.error(`Error while creating new user in database`, true);
            return false;
        }
    }
    async getUser(telegramId: number): Promise<IUser | null> {
        try {
            const user: IUser | null = await UserModel.findOne({ telegramId: String(telegramId) });
            return user;
        } catch (error) {
            this.loggerService.error(`Error with getting user`, true);
            return null;
        }
    }
    async incrementRequestsCounter(telegramId: number): Promise<boolean> {
        try {
            const user: IUser | null = await UserModel.findOne({ telegramId: String(telegramId) });
            if (!user) return false;

            user.requests = user.requests + 1;

            await UserModel.updateOne({ telegramId: String(telegramId) }, user);
            return true;
        } catch (error) {
            this.loggerService.error(`Error while updating request counter`, true);
            return false;
        }
    }
    async decreaseFreeRequests(telegramId: number): Promise<boolean> {
        try {
            const user = await UserModel.findOne({ telegramId: String(telegramId) });
            if (!user) return false;

            if (user.freeRequests !== 0) {
                user.freeRequests = user.freeRequests - 1;
            }
            await UserModel.updateOne({ telegramId: String(telegramId) }, user);
            return true;
        } catch (error) {
            this.loggerService.error('Error while decreasing free requests counter', true);
            return false;
        }
    }
    async setFreeRequests(telegramId: number, amount: number): Promise<boolean> {
        try {
            const user = await UserModel.findOne({ telegramId: String(telegramId) });
            if (!user) return false;

            user.freeRequests = amount;
            await UserModel.updateOne({ telegramId: String(telegramId) }, user);
            return true;
        } catch (error) {
            this.loggerService.error('Error while setting free requests', true);
            return false;
        }
    }
    async setUserList(telegramId: number, list: string): Promise<boolean> {
        try {
            const user = await UserModel.findOne({ telegramId: String(telegramId) });
            if (!user) return false;
            
            user.list = list;
            
            await UserModel.updateOne({ telegramId: String(telegramId) }, user);
            return true;
        } catch (error) {
            this.loggerService.error(`Error while updating user's list`, true);
            return false;
        }
    }
    async setRequestedStatus(telegramId: number, isRequested: boolean): Promise<boolean> {
        try {
            const user = await UserModel.findOne({ telegramId: String(telegramId) });
            if (!user) return false;

            user.requested = isRequested;

            await UserModel.updateOne({ telegramId: String(telegramId) }, user);
            return true;
        } catch (error) {
            this.loggerService.error('Error while updating requested status', true);
            return false;
        }
    }
    async initConversation(telegramId: number): Promise<boolean> {
        try {
            const conversation = this.getConversation(telegramId);
            if (!conversation) {
                await this.saveConversation(telegramId, []);
            }
            return true;
        } catch (error) {
            this.loggerService.error(`Error whilr creating new conversation`, true);
            return false;
        }
    }
    async saveConversation(telegramId: number, messages: IMessage[]): Promise<boolean> {
        try {
            const user = await this.getUser(telegramId);
            await new ConversationModel({
                messages, 
                telegramId: String(telegramId),
                username: user?.username || ''
            }).save();
            return true;
        } catch (error) {
            this.loggerService.error(`Error while saving conversation`, true);
            return false;
        }
    }
    async updateConversation(telegramId: number, messages: IMessage[]): Promise<boolean> {
        try {
            const conversation: IConversation | null = await this.getConversation(telegramId);
            if (!conversation) return false;
            conversation.messages = messages;

            await ConversationModel.updateOne({ telegramId: String(telegramId) }, conversation);
    
            return true;
        } catch (error) {
            this.loggerService.error(`Error while updating conversation`, true);
            return false;
        }
    }
    async getConversation(telegramId: number): Promise<IConversation | null> {
        try {
            const conversation: IConversation | null = await ConversationModel.findOne({ telegramId: String(telegramId) });
            if (!conversation) return null;
            return conversation;
        } catch (error) {
            this.loggerService.error(`Error while getting conversation`, true);
            return null;
        }
    }
    async getOrInitConversation(telegramId: number): Promise<IConversation | null> {
        try {
            let conversation = await this.getConversation(telegramId);
            if (!conversation) {
                await this.saveConversation(telegramId, []);
                conversation = await this.getConversation(telegramId);
            }
            return conversation;
        } catch (error) {
            this.loggerService.error('Error while getting/creating conversation', true);
            return null;
        }
    }
    async getWhitelistedUsers(): Promise<IUser[]> {
        try {
            const users: IUser[] = [];
            const whitelistedUsers =  await UserModel.find({ list: this.list.white });
            const limitedUsers =  await UserModel.find({ list: this.list.limited });
    
            for(let i = 0; i < whitelistedUsers.length; i++) {
                users.push(whitelistedUsers[i]);
            }
    
            for(let i = 0; i < limitedUsers.length; i++) {
                users.push(limitedUsers[i]);
            }
            return users;
        } catch (error) {
            this.loggerService.error(`Error while getting whitelist`, true);
            return [];
        }
    }
    async getAllUsers(): Promise<IUser[]> {
        try {
            const users: Array<IUser> = await UserModel.find({});
            return users;
        } catch (error) {
            this.loggerService.error('Error while getting all users', true);
            return [];
        }
    }
    async isAdmin(telegramId: number): Promise<boolean> {
        const user = await this.getUser(telegramId);
        if (!user) return false;

        return user.role === this.roles.admin;
    }
}