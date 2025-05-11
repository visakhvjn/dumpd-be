import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
	title: { type: String, required: true },
	subtopics: [String],
	createdAt: { type: Date, default: Date.now },
});

export const topicModel = mongoose.model('Topic', topicSchema);
