import { unlink } from 'fs/promises';
import { mongo } from './mongo.js';
import dateFormat from 'dateformat';

export async function removeFile(path) {
    try {
        await unlink(path);
    } catch (error) {
        console.log('Error with file remove');
    }
}

export async function isAdmin(telegramId) {
    const user = await mongo.getUser(String(telegramId));
    return user.role === mongo.roles.ADMIN;
}

export function getDate() {
    let date = new Date();
    return dateFormat(date, 'dd.mm.yyyy');
}

export function getTime() {
    let date = new Date();
    return dateFormat(date, 'HH:MM:ss');
}