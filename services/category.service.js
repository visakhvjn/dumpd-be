import { openai } from '../config/openai.js';
import { categoryModel } from '../models/category.model.js';
import { followingModel } from '../models/following.model.js';

import * as blogService from '../services/blog.service.js';
import * as imageService from '../services/image.service.js';
import * as Errors from '../utils/errors.js';

export const getCategories = async () => {
	return categoryModel.find({}).sort({ name: 1 });
};

export const getCategory = async (name) => {
	return categoryModel.findOne({ name });
};

export const getCategoryById = async (categoryId) => {
	return categoryModel.findById(categoryId);
};

export const getCategoriesByIds = async (categoryIds) => {
	return categoryModel.find({ _id: { $in: categoryIds } });
};

export const createCategory = async (
	name,
	description,
	prompt,
	subcategories
) => {
	if (await doesCategoryExist(name)) {
		throw new Errors.BadRequestError(
			`Category with name = ${name} already exists!`
		);
	}

	return categoryModel.create({
		name,
		description,
		prompt,
		subcategories,
	});
};

export const doesCategoryExist = async (name) => {
	const category = await categoryModel.findOne({ name });
	return !!category;
};

export const updateCategoryById = async (categoryId, subcategories) => {
	const category = await categoryModel.findById(categoryId);

	if (!category) {
		throw new Errors.NotFoundError(
			`category with id = ${categoryId} was not found!`
		);
	}

	return categoryModel.updateOne(
		{ _id: categoryId },
		{ $set: { subcategories: [...category.subcategories, ...subcategories] } }
	);
};

export const getRandomCategoryAndSubCategory = async () => {
	const categoryArray = await categoryModel.aggregate([
		{ $sample: { size: 1 } },
	]);

	const category = categoryArray[0];

	const randomSubCategoryIndex = Math.floor(
		Math.random() * category.subcategories.length
	);
	const subcategory = category.subcategories[randomSubCategoryIndex];

	return { category: category.name, subcategory };
};

export const updateCategoryBlogCount = async (name) => {
	return categoryModel.updateOne({ name }, { $inc: { blogCount: 1 } });
};

export const generateCategoryAndSubcategoryImage = async () => {
	// get random category
	const categoryArray = await categoryModel.aggregate([
		{ $match: { blogCount: { $gt: 0 } } },
		{ $sample: { size: 1 } },
	]);

	const category = categoryArray[0];

	// check if it already has an image
	const hasImage = await imageService.hasImage(category.name);

	if (hasImage) {
		console.log(`Image present for category=${category.name}`);
		return 0;
	}

	if (!category.blogCount) {
		console.log(`No blogs found for category=${category.name}`);
		return 0;
	}

	console.log(`Generating image for category=${category.name}`);

	// generate the image
	const imageDetails = await imageService.generateImage(category.name);

	// save the image
	await imageService.saveImage(
		imageDetails.imageURL,
		imageDetails.transformedImageURL,
		category.name
	);

	return 1;
};

export const followCategory = async (userId, categoryId) => {
	const followingExists = await doesFollowingExist(userId, categoryId);

	if (followingExists) {
		throw new Errors.ForbiddenError(`Following already exists`);
	}

	return followingModel.create({
		userId,
		categoryId,
	});
};

export const doesFollowingExist = async (userId, categoryId) => {
	const following = await followingModel.findOne({
		userId,
		categoryId,
	});

	return !!following;
};

export const isCategoryFollowed = async (userId, categoryId) => {
	const following = await followingModel.findOne({
		userId,
		categoryId,
	});

	return !!following;
};

export const unfollowCategory = async (userId, categoryId) => {
	const followingExists = await doesFollowingExist(userId, categoryId);

	if (!followingExists) {
		throw new Errors.ForbiddenError(`Following already exists`);
	}

	return followingModel.deleteOne({
		userId,
		categoryId,
	});
};

export const getUserCategoryFollowings = async (userId) => {
	return followingModel.find({ userId });
};

export const generateSubCategories = async () => {
	// pick a random category
	const randomCategory = await categoryModel.aggregate([
		{ $sample: { size: 1 } },
	]);

	const category = randomCategory[0];

	const subcategories = category.subcategories;

	// get new subcategories using LLM
	const newSubcategories = await generateSubCategoriesUsingLLM(
		category.name,
		subcategories,
		category.prompt
	);

	// make sure they are not duplicated
	for (const newSubcategory of newSubcategories) {
		if (!subcategories.includes(newSubcategory)) {
			subcategories.push(newSubcategory);
		}
	}

	await categoryModel.updateOne(
		{ _id: category._id },
		{ $set: { subcategories } }
	);
};

const generateSubCategoriesUsingLLM = async (
	category,
	subcategories,
	prompt
) => {
	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		temperature: 0.7,
		messages: [
			{
				role: 'system',
				content:
					'You are a software engineer who is an expert in generating subcategories for a given category.',
			},
			{
				role: 'user',
				content: `
					Generate subcategories which are closely related to the category = ${category}.

					${prompt ? prompt : ''}

					- Make sure they are not too long and are not too short.
					- Make sure not to repeat them and make sure they are not too similar to each other.
					- Make sure to generate 3 subcategories. The subcategories will be used to generate blogs.

					These are the current subcategories in the system.
					${subcategories.join(', ')}

					- Make sure to generate subcategories which are not already present in the system.

					return a string of subcategories separated by commas.
					Make sure to not add any other text or explanation.
				`,
			},
		],
	});

	const newSubcategories = response.choices[0].message.content;
	return newSubcategories.split(', ');
};
