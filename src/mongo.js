import { UserModel } from './models/user.model.js';
import { ConversationModel } from './models/conversation.model.js';

class MongoDB {
    async saveUser(telegramId, username, fullname) {
        return await new UserModel({
            telegramId: telegramId,
            username: username,
            fullname: fullname,
            list: 'none'
        }).save();
    }

    async getUser(telegramId) {
        return await UserModel.findOne({ telegramId });
    }

    async updateUserList(telegramId, list) {
        let user = await UserModel.findOne({ telegramId });
        user.list = list;

        return await UserModel.updateOne({ telegramId }, user);
    }

    async initConversation(telegramId) {
        await this.updateConversation([], telegramId);
    }

    async saveConversation(messages, telegramId) {
        return await new ConversationModel({
            messages, 
            telegramId,
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
}

export const mongo = new MongoDB();