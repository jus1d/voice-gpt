import { ConversationModel, IConversation, IMessage } from "../../src/database/models/conversation.model";
import { UserModel, IUser } from "../../src/database/models/user.model";
import { IDatabase } from "./database.interface";
import mongoose from 'mongoose';
import config from 'config';
import { log } from "../../src/logger";

export class DatabaseService implements IDatabase {
    roles = {
        admin: 'admin',
        user: 'user'
    }

    list = {
        white: 'white',
        black: 'black',
        limited: 'limited',
        none: 'none'
    }
    async init(): Promise<void> {
        await mongoose.connect(config.get('mongo_uri'));
    }

    async saveUser(telegramId: number, username: string, fullname: string, role = this.roles.user): Promise<boolean> {
        try {
            await new UserModel({
                telegramId,
                username: username || '',
                fullname,
                role,
            }).save();
            return true;
        } catch (error) {
            log.error(`Error while creating new user in database`);
            return false;
        }
    }

    async getUser(): Promise<IUser> {
        throw new Error("Method not implemented.");
    }

    async incrementRequestsCounter(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async decreaseFreeRequests(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async setFreeRequests(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async setUserList(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async setRequestedStatus(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async initConversation(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async saveConversation(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async updateConversation(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async getConversation(): Promise<IConversation | null> {
        throw new Error("Method not implemented.");
    }

    async getAllUsers(): Promise<IUser[]> {
        throw new Error("Method not implemented.");
    }

    async isAdmin(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}