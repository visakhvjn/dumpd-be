import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	name: String,
	writingStyle: String,
	personalityTraits: [{ type: String }],
	areasOfExpertise: [{ type: String }],
	authorBio: String,
	createdAt: { type: Date, default: Date.now },
	slug: { type: String, unique: true },
	creativityLevel: { type: Number, default: 0.1 },
	profilePictureURL: String,
});

export const userModel = mongoose.model('User', userSchema);
