import * as userService from '../services/userService.js';
import * as blogService from '../services/blogService.js';

import mongoose from 'mongoose';

export const getUsers = async (req, res) => {
	const users = await userService.getUsers();
	res.json(users);
};

export const getUser = async (req, res) => {
	try {
		const { userId } = req.params;

		if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
			res.status(400).json({ error: 'Invalid userId!' });
		}

		const user = await userService.getUser(userId);

		res.json(user);
	} catch (err) {
		res.status(404).json({ error: err.message });
	}
};

export const getBlogs = async (req, res) => {
	let { page, size } = req.query;

	if (!page || parseInt(page) < 1) page = 1;
	if (!size || parseInt(size) < 1) size = 10;

	if ((page && size && isNaN(page)) || isNaN(size)) {
		res.status(400).json({
			error: 'Invalid values for size/page params. Please pass numbers',
		});
	}

	const blogs = await blogService.getBlogs(page, size);
	res.json(blogs);
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
		res.status(400).json({ error: err.message });
	}
};
