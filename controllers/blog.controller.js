import { marked } from 'marked';
import moment from 'moment';

import { blogModel } from '../models/blog.model.js';
import { getUser, getUsers } from '../services/user.service.js';
import * as blogService from '../services/blog.service.js';
import * as categoryService from '../services/category.service.js';

export const getAllBlogs = async (req, res) => {
	const search = req.query.search || '';

	const blogs = await blogService.getBlogs(search, 1, 10);
	const popularBlogs = search ? [] : await blogService.getPopularBlogs(1, 5);
	const users = await getUsers();

	let isCategoryFollowed = false;
	let isFollowingTabSelected = false;

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			content: marked.parse(blog.content),
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
		subcategory: null,
		categories,
		subcategories: [],
		users,
		popularBlogs,
		hasCategoryFilter: false,
		isLoggedIn: req.oidc.isAuthenticated(),
		authUser: req.oidc.user,
		userId: req?.userId,
		isCategoryFollowed,
		isFollowingTabSelected,
		search,
	});
};

export const getAllFollowingBlogs = async (req, res) => {
	let followedCategories = [];
	let blogs = [];

	if (req.userId) {
		const categoryFollowings = await categoryService.getUserCategoryFollowings(
			req.userId
		);
		const categoryIds = categoryFollowings.map(
			(categoryFollowing) => categoryFollowing.categoryId
		);

		const categories = await categoryService.getCategoriesByIds(categoryIds);
		followedCategories = categories.map((category) => category.name);
	}

	blogs = await blogService.getBlogsByFollowings(1, 10, followedCategories);

	const popularBlogs = await blogService.getPopularBlogs(1, 5);
	const users = await getUsers();

	let isCategoryFollowed = false;

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			content: marked.parse(blog.content),
			date: moment(blog.createdAt).format('MMM DD, YYYY'),
			user: users.find(
				(user) => user._id.toString() === blog.userId.toString()
			),
			isFollowingTabSelected: true,
		};
	});

	const categories = await categoryService.getCategories();

	res.render('blogs', {
		blogs: parsedBlogs,
		category: null,
		subcategory: null,
		categories,
		subcategories: [],
		users,
		popularBlogs,
		hasCategoryFilter: false,
		isLoggedIn: req.oidc.isAuthenticated(),
		authUser: req.oidc.user,
		userId: req?.userId,
		isCategoryFollowed,
		isFollowingTabSelected: true,
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
		let content = marked.parse(blog.content);
		const date = moment(blog.createdAt).format('MMM DD, YYYY');
		const category = blog.category;
		const subcategory = blog.subcategory;
		const summary = blog.summary;
		const views = blog.views || 0;
		const domain = `${req.protocol}://${req.get('host')}`;

		// check if the blog is premium content
		const isPremium = blog.aiModel.includes('-4') ? true : false;
		const isAuthenticated = req.oidc.isAuthenticated();

		if (isPremium && !isAuthenticated) {
			content = content.substring(0, 200);
		}

		let user = {};

		if (blog?.userId) {
			user = await getUser(blog.userId);
		}

		// Update view count
		await updateViews(slug);

		res.render('blog', {
			blog: {
				id: blog._id,
				title,
				content,
				date,
				category,
				subcategory,
				summary,
				views,
				user,
				slug,
				domain,
				isVectorized: blog.isVectorized && isAuthenticated,
			},
			isLoggedIn: isAuthenticated,
			authUser: req.oidc.user,
			userId: req?.userId,
			isPremium,
		});
	} catch (err) {
		console.error('❌ Error fetching blog:', err);
		res.status(404).render('404', { title: 'Blog Not Found' });
	}
};

export const getBlogsByCategory = async (req, res) => {
	try {
		const categoryName = req.params.category;
		const blogs = await blogService.getBlogs('', 1, 10, categoryName);
		const popularBlogs = await blogService.getPopularBlogs(1, 5, categoryName);
		const category = await categoryService.getCategory(categoryName);

		let isCategoryFollowed = false;
		let isFollowingTabSelected = false;

		if (req.oidc.isAuthenticated()) {
			isCategoryFollowed = await categoryService.isCategoryFollowed(
				req.userId,
				category._id
			);
		}

		const users = await getUsers();

		if (!blogs.length) {
			return res.render('blogs', {
				blogs: [],
				categories: [],
				subcategories: category.subcategories.sort((a, b) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				),
				category: category,
				popularBlogs,
				isLoggedIn: req.oidc.isAuthenticated(),
				authUser: req.oidc.user,
				userId: req?.userId,
				isCategoryFollowed,
				isFollowingTabSelected,
				hasCategoryFilter: true,
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
			};
		});

		res.render('blogs', {
			blogs: parsedBlogs,
			category: category,
			subcategory: null,
			categories: [],
			subcategories: category.subcategories.sort((a, b) =>
				a.toLowerCase().localeCompare(b.toLowerCase())
			),
			popularBlogs,
			hasCategoryFilter: true,
			isLoggedIn: req.oidc.isAuthenticated(),
			authUser: req.oidc.user,
			userId: req?.userId,
			isCategoryFollowed,
			isFollowingTabSelected,
		});
	} catch (err) {
		console.error('❌ Error fetching blogs by category:', err);
		res.status(404).render('404', { title: 'Category Not Found' });
	}
};

export const getBlogsBySubCategory = async (req, res) => {
	try {
		const categoryName = req.params.category;
		const subcategoryName = req.params.subcategory;

		const blogs = await blogService.getBlogs(
			'',
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
		const users = await getUsers();

		let isFollowingTabSelected = false;
		let isCategoryFollowed = false;

		if (req.oidc.isAuthenticated()) {
			isCategoryFollowed = await categoryService.isCategoryFollowed(
				req.userId,
				category._id
			);
		}

		if (!blogs.length) {
			return res.render('blogs', {
				blogs: [],
				category,
				categories: [],
				subcategories: category.subcategories.sort((a, b) =>
					a.toLowerCase().localeCompare(b.toLowerCase())
				),
				popularBlogs,
				hasCategoryFilter: true,
				isLoggedIn: req.oidc.isAuthenticated(),
				authUser: req.oidc.user,
				userId: req?.userId,
				isCategoryFollowed,
				isFollowingTabSelected,
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
			};
		});

		res.render('blogs', {
			blogs: parsedBlogs,
			category: category,
			subcategory: subcategoryName,
			categories: [],
			subcategories: category.subcategories.sort((a, b) =>
				a.toLowerCase().localeCompare(b.toLowerCase())
			),
			popularBlogs,
			hasCategoryFilter: true,
			isLoggedIn: req.oidc.isAuthenticated(),
			authUser: req.oidc.user,
			userId: req?.userId,
			isCategoryFollowed,
			isFollowingTabSelected,
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

export const searchBlogs = async (req, res) => {
	const blogs = await blogService.searchBlogs(req.query.search);
	const popularBlogs = [];
	const users = [];

	let isCategoryFollowed = false;
	let isFollowingTabSelected = false;

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			content: marked.parse(blog.content),
			date: moment(blog.createdAt).format('MMM DD, YYYY'),
			user: users.find(
				(user) => user._id.toString() === blog.userId.toString()
			),
		};
	});

	const categories = [];

	res.render('blogs', {
		blogs: parsedBlogs,
		category: null,
		subcategory: null,
		categories,
		subcategories: [],
		users,
		popularBlogs,
		hasCategoryFilter: false,
		isLoggedIn: req.oidc.isAuthenticated(),
		authUser: req.oidc.user,
		userId: req?.userId,
		isCategoryFollowed,
		isFollowingTabSelected,
	});
};

export const queryBlog = async (req, res) => {
	const blogId = req.params.blogId;
	const { query } = req.body;

	if (req.oidc.isAuthenticated() === false) {
		return res.status(401).json({
			error: 'You must be logged in to ask questions about the blog',
		});
	}

	if (query.split(' ').length > 50) {
		return res.status(400).json({
			error:
				'Woah! that looks like a lot to handle. Can you rephrase that and keep it under 50 words',
		});
	}

	const summary = await blogService.queryBlog(blogId, query);

	res.status(200).json({ summary });
};
