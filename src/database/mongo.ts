import { ConversationModel, IConversation, IMessage } from "./models/conversation.model";
import { UserModel, IUser } from "./models/user.model";
import { log } from "../logger";

class MongoDB {
    roles = {
        admin: 'admin',
        user: 'user'
    }

    list = {
        white: 'white',
        black: 'black',
        limited: 'limited',
        rejected: 'rejected',
        none: 'none'
    }

    async saveUser(telegramId: number, username: string, fullname: string, role = this.roles.user): Promise<boolean> {
        try {
            await new UserModel({
                telegramId,
                username,
                fullname,
                role,
            }).save();
            return true;
        } catch (error) {
            log.error(`Error while creating new user in database`);
            return false;
        }
    }

    async getUser(telegramId: number): Promise<IUser | null> {
        try {
            const user: IUser | null = await UserModel.findOne({ telegramId: String(telegramId) });
            return user;
        } catch (error) {
            log.error(`Error with getting user`);
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
            log.error(`Error while updating request counter`);
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
            log.error(`Error while updating user's list`);
            return false;
        }
    }

    async initConversation(telegramId: number): Promise<boolean> {
        try {
            await this.saveConversation(telegramId, []);
            return true;
        } catch (error) {
            log.error(`Error whilr creating new conversation`);
            return false;
        }
    }

    async saveConversation(telegramId: number, messages: Array<IMessage>): Promise<boolean> {
        try {
            const user = await this.getUser(telegramId);
            await new ConversationModel({
                messages, 
                telegramId: String(telegramId),
                username: user?.username
            }).save();
            return true;
        } catch (error) {
            log.error(`Error while saving conversation`);
            return false;
        }
    }

    async updateConversation(telegramId: number, messages: Array<IMessage>): Promise<boolean> {
        try {
            const conversation: IConversation | null = await this.getConversation(telegramId);
            if (!conversation) return false;
            conversation.messages = messages;

            await ConversationModel.updateOne({ telegramId: String(telegramId) }, conversation);
    
            return true;
        } catch (error) {
            log.error(`Error while updating conversation`);
            return false;
        }
    }

    async getConversation(telegramId: number): Promise<IConversation | null> {
        try {
            const conversation: IConversation | null = await ConversationModel.findOne({ telegramId: String(telegramId) });
            if (!conversation) return null;
            return conversation;
        } catch (error) {
            log.error(`Error while getting conversation`);
            return null;
        }
    }

    async getWhitelistedUsers() {
        try {
            const users = [];
            const whitelistedUsers =  await UserModel.find({ list: this.list.white });
            const limitedUsers =  await UserModel.find({ list: this.list.limited });
    
            for(let i = 0; i < whitelistedUsers.length; i++) {
                users.push({ 
                    telegramId: whitelistedUsers[i].telegramId,
                    username: whitelistedUsers[i].username,
                    list: whitelistedUsers[i].list,
                    requests: whitelistedUsers[i].requests
                 });
            }
    
            for(let i = 0; i < limitedUsers.length; i++) {
                users.push({ 
                    telegramId: limitedUsers[i].telegramId,
                    username: limitedUsers[i].username,
                    list: limitedUsers[i].list,
                    requests: limitedUsers[i].requests
                 });
            }
            return users;
        } catch (error) {
            log.error(`Error while getting whitelist`);
        }
    }

    async getAllUsers(): Promise<Array<IUser>> {
        try {
            const users: Array<IUser> = await UserModel.find({});
            return users;
        } catch (error) {
            log.error('Error while getting all users');
            return [];
        }
    }

    async isAdmin(telegramId: number): Promise<boolean> {
        const user = await this.getUser(telegramId);
        if (!user) return false;

        return user.role === mongo.roles.admin;
    }
}

export const mongo = new MongoDB();