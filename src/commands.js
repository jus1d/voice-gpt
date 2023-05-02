import { isAdmin } from "./utils.js";
import { logger as log } from "./logger.js";
import { mongo } from './mongo.js';

class Commands {

    async onNewCommand(ctx) {
        await mongo.initConversation(ctx.message.from.id);
        await ctx.reply('New chat created!');
        log.info(`User @${ctx.message.from.username}:${ctx.message.from.id} created new chat context`);
    }

    async onIdCommand(ctx) {
        ctx.reply(String(ctx.message.from.id));
    }

    async onWhitelistCommand(ctx) {
        try {
            if (!(await isAdmin(ctx.message.from.id))) return;
        
            let whiteCounterUsers = 0;
            let limitedCounterUsers = 0;
            let whitelistedUsers = '';
            let limitedUsers = '';
            let whitelistStr = '';
            const whitelist = await mongo.getWhitelistedUsers();
        
            for(let i = 0; i < whitelist.length; i++) {
                if (whitelist[i].list === mongo.list.WHITE) {
                    whitelistedUsers += `@${whitelist[i].username} - ${whitelist[i].requests} requests, for reject: /reject@${whitelist[i].telegramId}\n`;
                    whiteCounterUsers++;
                } else if (whitelist[i].list === mongo.list.LIMITED) {
                    limitedUsers += `@${whitelist[i].username} - ${whitelist[i].requests} requests, for reject: /reject@${whitelist[i].telegramId}\n`;
                    limitedCounterUsers++;
                }
            }
        
            if (whiteCounterUsers !== 0) {
                whitelistStr += `Whitelisted users: ${whiteCounterUsers}\n\n${whitelistedUsers}\n`;
            }
            if (limitedCounterUsers !== 0) {
                whitelistStr += `Limited users: ${whiteCounterUsers}\n\n${limitedUsers}`;
            }
            if (whiteCounterUsers === 0 && limitedCounterUsers === 0) {
                whitelistStr = 'No whitelisted users yet'
            }
        
            await ctx.reply(whitelistStr);
        } catch (error) {
            await ctx.reply('Error while getting whitelisted users');
            log.error(`Error while getting whitelisted users: ${error.message}`);
        }
    }

    async onRejectCommand(ctx) {
        const telegramId = ctx.message.text.replace('/reject@', '');
        const user = await mongo.getUser(telegramId);
        try {
            await mongo.updateUserList(telegramId, mongo.list.NONE);
            await ctx.reply(`Access for @${user.username} [${user.telegramId}] was rejected`);
            log.success(`Access for @${user.username}:${user.telegramId} was rejected`);
        } catch (error) {
            await ctx.reply(`Error while rejecting @${user.username} [${user.telegramId}]`);
            log.error(`Error while rejecting user @${user.username}:${user.telegramId}: ${error.message}`);
        }
    }
}

export const command = new Commands();