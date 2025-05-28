import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
	title: String,
	content: String,
	createdAt: { type: Date, default: Date.now },
	slug: { type: String },
	category: String,
	subcategory: String,
	summary: String,
	views: { type: Number, default: 0 },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	isPosted: { type: Boolean, default: false },
	aiModel: { type: String, default: null },
	hash: { type: String, default: null },
	isVectorized: { type: Boolean, default: false },
});

blogSchema.index({ slug: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ subcategory: 1 });
blogSchema.index({ hash: 1 });

blogSchema.index({ title: 'text', content: 'text', summary: 'text' });

export const blogModel = mongoose.model('Blog', blogSchema);
