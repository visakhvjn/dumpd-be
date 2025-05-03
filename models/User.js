import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	name: String,
	writingStyle: String,
	personalityTraits: [{ type: String }],
	areasOfExpertise: [{ type: String }],
	authorBio: String,
	createdAt: { type: Date, default: Date.now },
	slug: { type: String, unique: true },
	profilePictureURL: String,
});

export const userModel = mongoose.model('User', userSchema);
