import NodeCache from 'node-cache';

import { blogModel } from '../models/Blog.js';
import * as userService from './userService.js';
import * as Errors from '../utils/errors.js';

const cache = new NodeCache({ stdTTL: 3600 });

export const getBlogs = async (
	page = 1,
	size = 10,
	category = '',
	userId = ''
) => {
	const skip = (page - 1) * size;
	let query = {};

	if (category) {
		query = { categories: { $regex: new RegExp(`^${category}$`, 'i') } };
	}

	if (userId) {
		query.userId = userId;
	}

	const blogs = await blogModel
		.find(query)
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(size);

	return blogs;
};

export const getBlogByBlogId = async (blogId) => {
	const blog = await blogModel.findById(blogId);

	if (!blog) {
		throw new Errors.NotFoundError('Blog not found!');
	}

	const user = await userService.getUser(blog?.userId);

	return { blog, user };
};

export const getBlogBySlug = async (slug) => {
	const blog = await blogModel.findOne({ slug });

	if (!blog) {
		throw new Errors.NotFoundError('Blog not found!');
	}

	const user = await userService.getUser(blog?.userId);

	return { blog, user };
};

export const getAllCategories = async () => {
	const cachedCategories = cache.get('categories');

	if (cachedCategories) {
		return cachedCategories;
	}

	const categories = await blogModel.distinct('categories');
	cache.set('categories', categories, 21600);

	return categories;
};
