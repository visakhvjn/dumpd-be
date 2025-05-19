import mongoose from 'mongoose';

const followingSchema = new mongoose.Schema({
	userId: { type: mongoose.Types.ObjectId, required: true },
	categoryId: { type: mongoose.Types.ObjectId, required: true },
	createdAt: { type: Date, default: Date.now },
});

followingSchema.index({ userId: 1 });
followingSchema.index({ categoryId: 1, userId: 1 }, { unique: true });

export const followingModel = mongoose.model('Following', followingSchema);
