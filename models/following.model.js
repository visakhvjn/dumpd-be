import mongoose from 'mongoose';

const followingSchema = new mongoose.Schema({
	userId: { type: mongoose.Types.ObjectId, required: true },
	categoryId: { type: mongoose.Types.ObjectId, required: true },
	createdAt: { type: Date, default: Date.now },
});

export const followingModel = mongoose.model('Following', followingSchema);
