import { IDatabase } from "../database/database.interface";
import { IUser } from "../database/models/user.model";
import { IUtils, IButton } from "./utils.interface";

export class UtilsService implements IUtils {
    constructor(private readonly databaseService: IDatabase) {}

    async getUserStatsText(telegramId: number | string): Promise<string> {
        const user = await this.databaseService.getUser(telegramId);
        if (!user) return `<b>No user with ID: <code>${telegramId}</code></b>`;

        let messageTextWithHTML = `<b>User @${user.username} [<code>${user.telegramId}</code>] stats:</b>\n\n` + 
            `<b>Listed:</b> <code>${user.list}</code>\n` + 
            `<b>Total requests:</b> <code>${user.requests}</code>`;

        if (user.list === 'limited') {
            messageTextWithHTML += `\n<b>Free requests: </b> <code>${user.freeRequests}</code>`;
        }
        if (user.role === 'admin') {
            messageTextWithHTML += `\n\n<b>Role: </b> <code>${user.role}</code>`;
        }

        return messageTextWithHTML;
    }
    async getUsersText(): Promise<string> {
        const users: Array<IUser> = await this.databaseService.getAllUsers();
        let messageTextWithHTML = `<b>Total users:</b> ${users.length}\n\n`;
        for (let i = 0; i < users.length; i++) {
            messageTextWithHTML += `@${users[i].username} - ${users[i].requests} requests. /manage@${users[i].telegramId}\n`
        }
        return messageTextWithHTML;
    }
    async getWhitelistText(): Promise<string> {
        let messageTextWithHTML = '';
        let whiteUsersCounter = 0;
        let limitedUsersCounter = 0;
        let whitelistedUsersStr = '';
        let limitedUsersStr = '';
        const whitelist = await this.databaseService.getWhitelistedUsers();

        if (!whitelist) return 'Error while getting whitelisted users';

        for (let i = 0; i < whitelist.length; i++) {
            if (whitelist[i].list === 'white') {
                whitelistedUsersStr += `@${whitelist[i].username} - ${whitelist[i].requests} requests. /manage@${whitelist[i].telegramId}\n`;
                whiteUsersCounter++;
            } else if (whitelist[i].list === 'limited') {
                limitedUsersStr += `@${whitelist[i].username} - ${whitelist[i].requests} requests. /manage@${whitelist[i].telegramId}\n`;
                limitedUsersCounter++;
            }
        }
        
        if (whiteUsersCounter !== 0) messageTextWithHTML += `<b>Whitelisted users:</b> ${whiteUsersCounter}\n\n${whitelistedUsersStr}\n`;
        if (limitedUsersCounter !== 0) messageTextWithHTML += `<b>Limited users:</b> ${limitedUsersCounter}\n\n${limitedUsersStr}`;
        if (whiteUsersCounter === 0 && limitedUsersCounter === 0) messageTextWithHTML = '<b>No whitelisted users yet</b>'

        return messageTextWithHTML;
    }
    getManageButtons(list: string): [ IButton[], IButton[], IButton[], IButton[] ] {
        const firstButtonRow = [];
        const secondButtonRow = [];
        const thirdButtonRow = [];
        const fourthButtonRow = [];

        if (list !== 'white') {
            firstButtonRow.push({ text: 'Whitelist', callback_data: 'whitelist' });
        }
        if (list !== 'limited') {
            firstButtonRow.push({ text: 'Limited', callback_data: 'limited' });
        } else {
            firstButtonRow.push({ text: 'Reset', callback_data: 'reset_free_requests' });
        }
        if (list !== 'none') {
            secondButtonRow.push({ text: 'None', callback_data: 'none' });
        }
        if (list !== 'black') {
            secondButtonRow.push({ text: 'Blacklist', callback_data: 'blacklist' });
        }
        thirdButtonRow.push({ text: 'See conversation', callback_data: 'get_conversation'});
        fourthButtonRow.push({ text: '« Back to users', callback_data: 'back_to_users' }, { text: 'Update', callback_data: 'update_stats' });

        return [ firstButtonRow, secondButtonRow, thirdButtonRow, fourthButtonRow];
    }
}