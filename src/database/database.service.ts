import { ConversationModel, IConversation, IMessage } from "./models/conversation.model";
import { IConfigService } from "../config/config.interface";
import { UserModel, IUser } from "./models/user.model";
import { ILogger } from "../logger/logger.interface";
import { IDatabase } from "./database.interface";
import mongoose from 'mongoose';
import signale from "signale";

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
        try {
            await mongoose.connect(this.configService.get('mongo_uri'));
            signale.info(`Connection to MongoDB established`);
        } catch (error) {
            signale.fatal(new Error('Error with connection to MongoDB'));
        }
    }
    async saveUser(telegramId: number | string, username: string, fullname: string): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            await new UserModel({
                telegramId,
                username: username || '',
                fullname: fullname || username || '',
                role: 'user',
            }).save();
            signale.success(`User @${username} [${telegramId}] saved to database`);
            return true;
        } catch (error) {
            signale.error(`Error while creating new user in database. ID: ${telegramId}, username: @${username}`);
            signale.fatal(error);
            return false;
        }
    }
    async getUser(telegramId: number | string): Promise<IUser | null> {
        try {
            telegramId = String(telegramId);
            const user: IUser | null = await UserModel.findOne({ telegramId });
            return user;
        } catch (error) {
            signale.error(`Error while getting user. ID: ${telegramId}`);
            signale.fatal(error);
            return null;
        }
    }
    async incrementRequestsCounter(telegramId: number | string): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const user: IUser | null = await UserModel.findOne({ telegramId });
            if (!user) return false;

            user.requests = user.requests + 1;

            await UserModel.updateOne({ telegramId: String(telegramId) }, user);
            return true;
        } catch (error) {
            signale.error(`Error while updating user's requests counter. ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async decreaseFreeRequests(telegramId: number | string): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const user = await UserModel.findOne({ telegramId });
            if (!user) return false;

            if (user.freeRequests !== 0) {
                user.freeRequests = user.freeRequests - 1;
            }
            await UserModel.updateOne({ telegramId }, user);
            return true;
        } catch (error) {
            signale.error(`Error while decreasing user's free requests counter. ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async setFreeRequests(telegramId: number | string, amount: number): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const user = await UserModel.findOne({ telegramId });
            if (!user) return false;

            user.freeRequests = amount;
            await UserModel.updateOne({ telegramId }, user);
            return true;
        } catch (error) {
            signale.error(`Error while granting free requests for user with ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async setUserList(telegramId: number | string, list: string): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const user = await UserModel.findOne({ telegramId });
            if (!user) return false;
            
            user.list = list;
            
            await UserModel.updateOne({ telegramId }, user);
            return true;
        } catch (error) {
            signale.error(`Error while updating user's list. ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async setRequestedStatus(telegramId: number | string, isRequested: boolean): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const user = await UserModel.findOne({ telegramId });
            if (!user) return false;

            user.requested = isRequested;

            await UserModel.updateOne({ telegramId }, user);
            return true;
        } catch (error) {
            signale.error(`Error while updating requested status for user with ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async initConversation(telegramId: number | string): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const conversation = this.getConversation(telegramId);
            if (!conversation) {
                await this.saveConversation(telegramId, []);
            }
            signale.success(`New conversation created for user with ID: ${telegramId}`);
            return true;
        } catch (error) {
            signale.error(`Error while creating new conversation. ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async saveConversation(telegramId: number | string, messages: IMessage[]): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const user = await this.getUser(telegramId);
            await new ConversationModel({
                messages,
                telegramId,
                username: user?.username || ''
            }).save();
            return true;
        } catch (error) {
            signale.error(`Error while saving conversation. ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async updateConversation(telegramId: number | string, messages: IMessage[]): Promise<boolean> {
        try {
            telegramId = String(telegramId);
            const conversation: IConversation | null = await this.getConversation(telegramId);
            if (!conversation) return false;
            conversation.messages = messages;

            await ConversationModel.updateOne({ telegramId }, conversation);
    
            return true;
        } catch (error) {
            signale.error(`Error while updating conversation. ID: ${telegramId}`);
            signale.fatal(error);
            return false;
        }
    }
    async getConversation(telegramId: number | string): Promise<IConversation | null> {
        try {
            telegramId = String(telegramId);
            const conversation: IConversation | null = await ConversationModel.findOne({ telegramId });
            if (!conversation) return null;
            return conversation;
        } catch (error) {
            signale.error(`Error with getting user's conversation. ID: ${telegramId}`);
            signale.fatal(error);
            return null;
        }
    }
    async getOrInitConversation(telegramId: number | string): Promise<IConversation | null> {
        try {
            let conversation = await this.getConversation(telegramId);
            if (!conversation) {
                await this.saveConversation(telegramId, []);
                conversation = await this.getConversation(telegramId);
            }
            return conversation;
        } catch (error) {
            signale.error(`Error while getting/creating conversation. ID: ${telegramId}`);
            signale.fatal(error);
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
            signale.error(`Error while getting whitelisted users`);
            signale.fatal(error);
            return [];
        }
    }
    async getAllUsers(): Promise<IUser[]> {
        try {
            const users: Array<IUser> = await UserModel.find({});
            return users;
        } catch (error) {
            signale.error(`Error while getting all users`);
            signale.fatal(error);
            return [];
        }
    }
    async isAdmin(telegramId: number | string): Promise<boolean> {
        const user = await this.getUser(telegramId);
        if (!user) return false;

        return user.role === this.roles.admin;
    }
}