import { marked } from 'marked';
import moment from 'moment';

import { blogModel } from '../models/blog.model.js';
import { openai } from '../config/openai.js';
import { getRandomTopic } from './topicController.js';
import {
	getRandomUser,
	getUser,
	getUserBySlug,
	getUsers,
} from '../services/user.service.js';
import * as blogService from '../services/blog.service.js';
import * as makeService from '../services/makeService.js';
import * as categoryService from '../services/category.service.js';
import * as imageService from '../services/image.service.js';

export const generateBlog = async (req, res) => {
	try {
		const blog = await blogService.generateBlog();
		res.json(blog);
	} catch (err) {
		console.error('❌ Error generating blog:', err);
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const getAllBlogs = async (req, res) => {
	const blogs = await blogService.getBlogs(1, 10);
	const popularBlogs = await blogService.getPopularBlogs(1, 5);
	const images = await imageService.getImages();
	const users = await getUsers();

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			content: marked.parse(blog.content),
			imagePath: images.find((img) => img.category === blog.category)?.path,
			date: moment(blog.createdAt).format('MMM DD, YYYY'),
			user: users.find(
				(user) => user._id.toString() === blog.userId.toString()
			),
		};
	});

	const categories = await categoryService.getCategories();

	res.render('blogs', {
		blogs: parsedBlogs,
		category: null,
		categories: categories.map((cat) => cat.name),
		subcategories: [],
		users,
		popularBlogs,
		hasCategoryFilter: false,
	});
};

export const getBlog = async (req, res) => {
	try {
		const slug = req.params.slug;
		const blog = await blogModel.findOne({ slug: slug });

		if (!blog) {
			throw Error('Blog not found');
		}

		const title = blog.title;
		const content = marked.parse(blog.content);
		const date = moment(blog.createdAt).format('MMM DD, YYYY');
		const category = blog.category;
		const subcategory = blog.subcategory;
		const summary = blog.summary;
		const views = blog.views || 0;
		const domain = `${req.protocol}://${req.get('host')}`;

		let user = {};

		if (blog?.userId) {
			user = await getUser(blog.userId);
		}

		let imagePath = '';

		if (category && subcategory) {
			const image = await imageService.getImage(category);

			if (image) {
				imagePath = image.path;
			}
		}

		// Update view count
		await updateViews(slug);

		res.render('blog', {
			blog: {
				title,
				content,
				date,
				category,
				subcategory,
				summary,
				views,
				user,
				imagePath,
				slug,
				domain,
			},
		});
	} catch (err) {
		console.error('❌ Error fetching blog:', err);
		res.status(404).render('404', { title: 'Blog Not Found' });
	}
};

export const getBlogsByCategory = async (req, res) => {
	try {
		const categoryName = req.params.category;
		const blogs = await blogService.getBlogs(1, 10, categoryName);
		const popularBlogs = await blogService.getPopularBlogs(1, 5, categoryName);
		const category = await categoryService.getCategory(categoryName);
		const images = await imageService.getImages();

		const users = await getUsers();

		if (!blogs.length) {
			return res.render('blogs', {
				blogs: [],
				categories: [],
				subcategories: category.subcategories.sort((a, b) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				),
				category: categoryName,
				popularBlogs,
			});
		}

		const parsedBlogs = blogs.map((blog) => {
			return {
				...blog._doc,
				summary: blog.summary,
				date: moment(blog.createdAt).format('MMM DD, YYYY'),
				user: users.find(
					(user) => user._id.toString() === blog.userId.toString()
				),
				imagePath: images.find((img) => img.category === blog.category)?.path,
			};
		});

		res.render('blogs', {
			blogs: parsedBlogs,
			category: categoryName,
			categories: [],
			subcategories: category.subcategories.sort((a, b) =>
				a.toLowerCase().localeCompare(b.toLowerCase())
			),
			popularBlogs,
			hasCategoryFilter: true,
		});
	} catch (err) {
		console.log(err);
		console.error('❌ Error fetching blogs by category:', err);
		res.status(404).render('404', { title: 'Category Not Found' });
	}
};

export const getBlogsBySubCategory = async (req, res) => {
	try {
		const categoryName = req.params.category;
		const subcategoryName = req.params.subcategory;

		const blogs = await blogService.getBlogs(
			1,
			10,
			categoryName,
			subcategoryName
		);
		const popularBlogs = await blogService.getPopularBlogs(
			1,
			5,
			categoryName,
			subcategoryName
		);
		const category = await categoryService.getCategory(categoryName);
		const images = await imageService.getImages();
		const users = await getUsers();

		if (!blogs.length) {
			return res.render('blogs', {
				blogs: [],
				category: categoryName,
				categories: [],
				subcategories: category.subcategories.sort((a, b) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				),
				popularBlogs,
			});
		}

		const parsedBlogs = blogs.map((blog) => {
			return {
				...blog._doc,
				summary: blog.summary,
				date: moment(blog.createdAt).format('MMM DD, YYYY'),
				user: users.find(
					(user) => user._id.toString() === blog.userId.toString()
				),
				imagePath: images.find((img) => img.category === blog.category)?.path,
			};
		});

		res.render('blogs', {
			blogs: parsedBlogs,
			category: categoryName,
			categories: [],
			subcategories: category.subcategories.sort((a, b) =>
				a.toLowerCase().localeCompare(b.toLowerCase())
			),
			popularBlogs,
			hasCategoryFilter: true,
		});
	} catch (err) {
		console.log(err);
		console.error('❌ Error fetching blogs by category:', err);
		res.status(404).render('404', { title: 'Category Not Found' });
	}
};

const updateViews = async (slug) => {
	return blogModel.updateOne({ slug: slug }, { $inc: { views: 1 } });
};

export const genBlog = async (req, res) => {
	await generateBlog();
	res.json({ message: 'Gnerated' });
};

export const getBlogsByUser = async (req, res) => {
	try {
		const userSlug = req.params.userSlug;
		const user = await getUserBySlug(userSlug);

		const blogs = await blogModel
			.find({ userId: user.id })
			.sort({ createdAt: -1 });

		if (blogs.length === 0) {
			throw Error('No blogs found for this category');
		}

		const parsedBlogs = blogs.map((blog) => {
			return {
				...blog._doc,
				summary: blog.summary,
				date: moment(blog.createdAt).format('MMM DD, YYYY hh:mm A'),
			};
		});

		const categories = await blogService.getAllCategories();
		const users = await getUsers();

		res.render('blogs', { blogs: parsedBlogs, categories, users });
	} catch (err) {
		console.error('❌ Error fetching blogs by category:', err);
		res.status(404).render('404', { title: 'Category Not Found' });
	}
};
