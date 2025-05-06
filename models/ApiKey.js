import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
	key: String,
	hits: { type: Number, default: 0 },
	email: String,
	active: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now },
});

export const apiKeyModel = mongoose.model('ApiKey', apiKeySchema);
