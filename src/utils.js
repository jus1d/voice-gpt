import { unlink } from 'fs/promises';
import config from 'config';
import { mongo } from './mongo.js';

export async function removeFile(path) {
    try {
        await unlink(path);
    } catch (error) {
        console.log('Error with file remove');
    }
}

export async function isAdmin(telegramId) {
    const user = await mongo.getUser(String(telegramId));
    return user.role === 'admin';
}