import { Schema, model } from "mongoose";

export interface IUser {
    telegramId: string,
    username: string,
    fullname: string,
    role: string,
    list: string,
    requests: number
}

const userSchema = new Schema<IUser>({
    telegramId: { type: String, required: true },
    username: { type: String, required: true },
    fullname: { type: String, required: true },
    role: { type: String, default: 'user' },
    list: { type: String, default: 'none' },
    requests: { type: Number, default: 0 },
});

export const UserModel = model<IUser>('User', userSchema);