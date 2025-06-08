import * as categoryService from '../services/category.service.js';
import * as Errors from '../utils/errors.js';

export const getCategories = async (req, res) => {
	try {
		const categories = await categoryService.getCategories();
		res.render('categories', {
			categories,
			isLoggedIn: req.oidc.isAuthenticated(),
			authUser: req.oidc.user,
		});
	} catch (err) {
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const createCategory = async (req, res) => {
	try {
		const { name, description, prompt, subcategories } = req.body;

		if (!name) {
			throw new Errors.BadRequestError('name cannot be empty!');
		}

		if (!description) {
			throw new Errors.BadRequestError('description cannot be empty!');
		}

		const category = await categoryService.createCategory(
			name,
			description,
			prompt,
			subcategories
		);

		res.status(200).json(category);
	} catch (error) {
		res.status(error.statusCode).json({ error: error.message });
	}
};

export const updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { subcategories } = req.body;

		const category = await categoryService.updateCategoryById(
			id,
			subcategories
		);

		return category;
	} catch (error) {
		res.status(error.statusCode).json({ error: error.message });
	}
};

export const followCategory = async (req, res) => {
	try {
		const { userId, categoryId } = req.params;

		const category = await categoryService.getCategoryById(categoryId);
		await categoryService.followCategory(userId, categoryId);

		res.redirect(`/blogs/categories/${category.name}`);
	} catch (error) {
		res.status(error.statusCode).json({ error: error.message });
	}
};

export const unfollowCategory = async (req, res) => {
	try {
		const { userId, categoryId } = req.params;

		const category = await categoryService.getCategoryById(categoryId);
		await categoryService.unfollowCategory(userId, categoryId);

		res.redirect(`/blogs/categories/${category.name}`);
	} catch (error) {
		res.status(error.statusCode).json({ error: error.message });
	}
};
