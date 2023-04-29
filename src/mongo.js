import { logger as log } from "./logger.js";
import { UserModel } from './models/user.model.js';
import { ConversationModel } from './models/conversation.model.js';

class MongoDB {
    async saveUser(telegramId, username, fullname, role = 'user') {
        try {
            return await new UserModel({
                telegramId: telegramId,
                username: username,
                fullname: fullname,
                role: role,
                list: 'none'
            }).save();
        } catch (error) {
            log.error(`Error while creating new user in database: ${error.message}`);
        }
    }

    async getUser(telegramId) {
        try {
            return await UserModel.findOne({ telegramId });
        } catch (error) {
            log.error(`Error with getting user: ${error.message}`);
        }
    }

    async addRequestCounter(telegramId) {
        try {
            let user = await UserModel.findOne({ telegramId });
            user.requests = user.requests + 1;
    
            return await UserModel.updateOne({ telegramId }, user);
        } catch (error) {
            log.error(`Error while updating request counter: ${error.message}`);
        }
    }

    async updateUserList(telegramId, list) {
        try {
            let user = await UserModel.findOne({ telegramId });
            user.list = list;
    
            return await UserModel.updateOne({ telegramId }, user);
        } catch (error) {
            log.error(`Error while updating user's list: ${error.message}`);
        }
    }

    async initConversation(telegramId) {
        try {
            await this.updateConversation([], telegramId);
        } catch (error) {
            log.error(`Error whilr creating new conversation: ${error.message}`);
        }
    }

    async saveConversation(messages, user) {
        try {
            return await new ConversationModel({
                messages, 
                telegramId: String(user.id), 
                username: user.username
            }).save();
        } catch (error) {
            log.error(`Error while saving conversation: ${error.message}`);
        }
    }

    async updateConversation(messages, telegramId) {
        try {
            let conversation = await ConversationModel.findOne({ telegramId });
            conversation.messages = messages;
    
            return await ConversationModel.updateOne({ telegramId }, conversation);
        } catch (error) {
            log.error(`Error while updating conversation: ${error.message}`);
        }
    }

    async getConversation(telegramId) {
        try {
            return await ConversationModel.findOne({ telegramId });
        } catch (error) {
            log.error(`Error while getting conversation: ${error.message}`);
        }
    }

    async getWhitelistedUsers() {
        try {
            const users = [];
            const whitelistedUsers =  await UserModel.find({ list: "white" });
            const limitedUsers =  await UserModel.find({ list: "limited" });
    
            for(let i = 0; i < whitelistedUsers.length; i++) {
                users.push({ 
                    telegramId: whitelistedUsers[i].telegramId,
                    username: whitelistedUsers[i].username,
                    list: whitelistedUsers[i].list
                 });
            }
    
            for(let i = 0; i < limitedUsers.length; i++) {
                users.push({ 
                    telegramId: limitedUsers[i].telegramId,
                    username: limitedUsers[i].username,
                    list: limitedUsers[i].list
                 });
            }
            return users;
        } catch (error) {
            log.error(`Error while getting whitelist: ${error.message}`);
        }
    }
}

export const mongo = new MongoDB();