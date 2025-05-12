import { categoryModel } from '../models/category.model.js';
import * as blogService from '../services/blog.service.js';
import * as imageService from '../services/image.service.js';
import * as Errors from '../utils/errors.js';

export const getCategories = async () => {
	return categoryModel.find({}).sort({ name: 1 });
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

export const generateCategoryAndSubcategoryImage = async () => {
	// get random category
	const categoryArray = await categoryModel.aggregate([
		{ $sample: { size: 1 } },
	]);

	const category = categoryArray[0];

	const randomIndex = Math.floor(Math.random() * category.subcategories.length);
	const subcategory = category.subcategories[randomIndex];

	// check if it already has an image
	const hasImage = await imageService.hasImage(category.name, subcategory);

	if (hasImage) {
		console.log(
			`Image present for category=${category.name} and subcategory=${subcategory}`
		);
		return 0;
	}

	const blogs = await blogService.getBlogs(1, 5, category.name, subcategory);

	if (!blogs.length) {
		console.log(
			`No blogs found for category=${category.name} and subcategory=${subcategory}`
		);
		return 0;
	}

	console.log(
		`Generating image for category=${category.name} and subcategory=${subcategory}`
	);

	// generate the image
	const fileName = await imageService.generateImage(category.name, subcategory);

	// save the image
	await imageService.saveImage(
		`/images/blog/${fileName}`,
		category.name,
		subcategory
	);

	return 1;
};
