import { mongo } from './database/mongo';

class Utilities {
    async getUserStatsText(telegramId: number): Promise<string> {
        const user = await mongo.getUser(telegramId);
        if (!user) return `<b>No user with ID: <code>${telegramId}</code></b>`;

        let messageTextWithHTML = `<b>User @${user.username} [<code>${user.telegramId}</code>] stats:</b>\n\n ` + 
            `<b>Listed:</b> <code>${user.list}</code>\n ` + 
            `<b>Total requests:</b> <code>${user.requests}</code>`;

        if (user.list === mongo.list.limited) {
            messageTextWithHTML += `\n<b>Free requests: </b> <code>${user.freeRequests}</code>`;
        }

        return messageTextWithHTML;
    }
}

export const utils = new Utilities();