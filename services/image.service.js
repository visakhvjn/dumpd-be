import fs from 'fs';
import path from 'path';

import { openai } from '../config/openai.js';
import { imageModel } from '../models/image.model.js';

export const generateImage = async (category) => {
	const imagePrompt = generateImagePrompt(category);

	const result = await openai.images.generate({
		model: 'gpt-image-1',
		prompt: imagePrompt,
		output_format: 'webp',
		size: '1024x1024',
		quality: 'low',
	});

	const fileName = getFileName() + '.webp';
	const filePath = path.resolve('public/images/blog', fileName);

	const image_base64 = result.data[0].b64_json;
	const image_bytes = Buffer.from(image_base64, 'base64');

	fs.writeFileSync(filePath, image_bytes);

	return fileName;
};

const generateImagePrompt = (category) => {
	return `
        Create a minimalistic black and white image relevant to ${category}.
		Make sure that the background is white.
    `;
};

const getFileName = () => {
	const timestamp = new Date();
	const timestampString = timestamp.toISOString().replace(/[^\w]/g, '');

	return timestampString;
};

export const hasImage = async (category) => {
	const image = await imageModel.findOne({ category });
	return !!image;
};

export const saveImage = async (imagePath, category) => {
	return imageModel.create({
		path: imagePath,
		category,
	});
};

export const getImage = async (category) => {
	return imageModel.findOne({ category });
};
