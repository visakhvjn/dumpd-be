import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
	title: String,
	createdAt: { type: Date, default: Date.now },
});

export const topicModel = mongoose.model('Topic', topicSchema);
