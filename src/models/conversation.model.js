import { Schema, Types, model } from 'mongoose';

const schema = new Schema({
    messages: [{ type: Object, required: true }],
      date: { type: Date, default: Date.now },
      cost: { type: Number, default: 0 },
      telegramId: { type: Types.ObjectId, ref: 'User' },
});

export const ConversationModel = model('Conversation', schema);