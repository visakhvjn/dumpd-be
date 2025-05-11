import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
	title: String,
	content: String,
	createdAt: { type: Date, default: Date.now },
	slug: { type: String, unique: true },
	category: String,
	subcategory: String,
	summary: String,
	views: { type: Number, default: 0 },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export const blogModel = mongoose.model('Blog', blogSchema);
