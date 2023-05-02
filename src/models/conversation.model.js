import { Schema, model } from 'mongoose';

const schema = new Schema({
  telegramId: { type: String, required: true },
  username: { type: String },
  messages: [{ type: Object, required: true }],
  date: { type: Date, default: Date.now },
  cost: { type: Number, default: 0 },
});

export const ConversationModel = model('Conversation', schema);