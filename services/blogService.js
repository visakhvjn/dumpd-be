import { blogModel } from '../models/Blog.js';

export const getBlogs = async (page = 1, size = 10) => {
	const skip = (page - 1) * size;

	const blogs = await blogModel
		.find({})
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(size);

	return blogs;
};
