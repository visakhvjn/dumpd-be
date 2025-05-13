import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	writingStyle: String,
	personalityTraits: [{ type: String }],
	areasOfExpertise: [{ type: String }],
	authorBio: String,
	createdAt: { type: Date, default: Date.now },
	slug: String,
	creativityLevel: { type: Number, default: 0.1 },
	profilePictureURL: String,
	email: { type: String, required: true },
	isHuman: { type: Boolean },
});

export const userModel = mongoose.model('User', userSchema);
