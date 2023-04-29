import { UserModel } from './models/user.model.js';
import { ConversationModel } from './models/conversation.model.js';

class MongoDB {
    async saveUser(telegramId, username, fullname, role = 'user') {
        return await new UserModel({
            telegramId: telegramId,
            username: username,
            fullname: fullname,
            role: role,
            list: 'none'
        }).save();
    }

    async getUser(telegramId) {
        return await UserModel.findOne({ telegramId });
    }

    async addRequestCounter(telegramId) {
        let user = await UserModel.findOne({ telegramId });
        user.requests = user.requests + 1;

        return await UserModel.updateOne({ telegramId }, user);
    }

    async updateUserList(telegramId, list) {
        let user = await UserModel.findOne({ telegramId });
        user.list = list;

        return await UserModel.updateOne({ telegramId }, user);
    }

    async initConversation(telegramId) {
        await this.updateConversation([], telegramId);
    }

    async saveConversation(messages, user) {
        return await new ConversationModel({
            messages, 
            telegramId: String(user.id), 
            username: user.username
        }).save();
    }

    async updateConversation(messages, telegramId) {
        let conversation = await ConversationModel.findOne({ telegramId });
        conversation.messages = messages;

        return await ConversationModel.updateOne({ telegramId }, conversation);
    }

    async getConversation(telegramId) {
        return await ConversationModel.findOne({ telegramId });
    }

    async getWhitelistedUsers() {
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
    }
}

export const mongo = new MongoDB();