import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String, required: true },
	prompt: { type: String, default: '' },
	subcategories: [String],
	blogCount: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now },
});

export const categoryModel = mongoose.model('Category', categorySchema);
