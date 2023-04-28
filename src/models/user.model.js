import { Schema, Types, model } from 'mongoose';

const schema = new Schema({
    telegradId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    list: { type: String, required: true },
    conversations: [{ type: Types.ObjectId, ref: 'Conversation' }],
});

export const UserModel = model('User', schema);