import { blogModel } from '../models/Blog.js';
import * as userService from './userService.js';

export const getBlogs = async (page = 1, size = 10) => {
	const skip = (page - 1) * size;

	const blogs = await blogModel
		.find({})
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(size);

	return blogs;
};

export const getBlog = async (blogId) => {
	const blog = await blogModel.findById(blogId);

	if (!blog) {
		throw Error('Blog not found!');
	}

	const user = await userService.getUser(blog?.userId);

	return { blog, user };
};
