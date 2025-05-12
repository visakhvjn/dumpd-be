import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
	path: { type: String, required: true },
	category: { type: String, required: true },
	subcategory: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
});

export const imageModel = mongoose.model('Image', imageSchema);
