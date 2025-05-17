import mongoose from 'mongoose';

const partSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	slug: { type: String, required: true },
	isGenerated: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

const seriesSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	slug: { type: String, required: true },
	isPartsComplete: { type: Boolean, default: false },
	partsCount: { type: Number, default: 10 },
	isComplete: { type: Boolean, default: false },
	parts: [{ type: partSchema }],
	createdAt: { type: Date, default: Date.now },
});

seriesSchema.index({ slug: 1 }, { unique: true });

export const seriesModel = mongoose.model('Series', seriesSchema);
