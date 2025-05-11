import { categoryModel } from '../models/category.model.js';
import * as Errors from '../utils/errors.js';

export const getCategories = async () => {
	return categoryModel.find({});
};

export const getCategory = async (name) => {
	return categoryModel.findOne({ name });
};

export const createCategory = async (name, description, subcategories) => {
	if (await doesCategoryExist(name)) {
		throw new Errors.BadRequestError(
			`Category with name = ${name} already exists!`
		);
	}

	return categoryModel.create({
		name,
		description,
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
	const categories = await getCategories();
	const randomCategoryIndex = Math.floor(Math.random() * categories.length);
	const category = categories[randomCategoryIndex];

	const randomSubCategoryIndex = Math.floor(
		Math.random() * category.subcategories.length
	);
	const subcategory = category.subcategories[randomSubCategoryIndex];

	return { category: category.name, subcategory };
};

export const updateCategoryBlogCount = async (name) => {
	return categoryModel.updateOne({ name }, { $inc: { count: 1 } });
};
