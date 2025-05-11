import * as userService from '../services/user.service.js';
import * as blogService from '../services/blogService.js';
import * as Errors from '../utils/errors.js';

import mongoose from 'mongoose';

export const getUsers = async (req, res) => {
	const users = await userService.getUsers();
	res.status(200).json(users);
};

export const getUser = async (req, res) => {
	try {
		const { userId } = req.params;

		if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
			throw new Errors.BadRequestError('Invalid userId!');
		}

		const user = await userService.getUser(userId);

		res.status(200).json(user);
	} catch (err) {
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const getBlogs = async (req, res) => {
	try {
		let { page, size, category, userId } = req.query;

		if (!page || parseInt(page) < 1) page = 1;
		if (!size || parseInt(size) < 1) size = 10;

		// if page and size are not numbers
		if ((page && size && isNaN(page)) || isNaN(size)) {
			throw new Errors.BadRequestError(
				'Invalid values for size/page params. Please pass numbers'
			);
		}

		// if category key is there but value isn't
		if (category !== undefined && category.trim() === '') {
			throw new Errors.BadRequestError('Invalid value for category');
		}

		// if userId key is present but empty or invalid
		if (userId !== undefined && !mongoose.Types.ObjectId.isValid(userId)) {
			throw new Errors.BadRequestError('Invalid userId!');
		}

		const blogs = await blogService.getBlogs(page, size, category, userId);
		res.json(blogs);
	} catch (err) {
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const getBlog = async (req, res) => {
	try {
		const { blogIdOrSlug } = req.params;

		let blog = {};

		if (mongoose.Types.ObjectId.isValid(blogIdOrSlug)) {
			blog = await blogService.getBlogByBlogId(blogIdOrSlug);
		} else {
			blog = await blogService.getBlogBySlug(blogIdOrSlug);
		}

		res.json(blog);
	} catch (err) {
		res.status(err.statusCode).json({ error: err.message });
	}
};
