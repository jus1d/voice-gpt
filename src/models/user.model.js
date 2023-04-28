import { Schema, Types, model } from 'mongoose';

const schema = new Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    list: { type: String, required: true },
    requests: { type: Number, default: 0 },
});

export const UserModel = model('User', schema);