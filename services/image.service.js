import fs from 'fs';
import path from 'path';

import { openai } from '../config/openai.js';
import { imageModel } from '../models/image.model.js';
import cloudinary from '../config/cloudinary.js';

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

	const imageURL = await uploadAndGetCloudinaryURL(filePath);
	const transformedImageURL = getTransformedImageURL(imageURL);

	return { imageURL, transformedImageURL };
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

export const saveImage = async (imagePath, transformedImagePath, category) => {
	return imageModel.create({
		path: imagePath,
		transformedPath: transformedImagePath,
		category,
	});
};

export const getImage = async (category) => {
	return imageModel.findOne({ category });
};

export const getImages = async () => {
	return imageModel.find({});
};

const uploadAndGetCloudinaryURL = async (filePath) => {
	try {
		const result = await cloudinary.uploader.upload(filePath, {
			folder: 'blog',
			use_filename: true,
			unique_filename: false,
			resource_type: 'image',
		});

		console.log('Image URL:', result.secure_url);
		return result.secure_url;
	} catch (err) {
		console.error('Cloudinary upload failed:', err);
		throw err;
	}
};

const getTransformedImageURL = (
	imageURL,
	transformation = 'w_768,h_572,c_fill'
) => {
	return imageURL.replace('/upload/', `/upload/${transformation}/`);
};
