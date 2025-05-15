import { marked } from 'marked';
import moment from 'moment';

import { blogModel } from '../models/blog.model.js';
import { getUser, getUsers } from '../services/user.service.js';
import * as blogService from '../services/blog.service.js';
import * as categoryService from '../services/category.service.js';
import * as imageService from '../services/image.service.js';

export const getAllBlogs = async (req, res) => {
	const blogs = await blogService.getBlogs(1, 10);
	const popularBlogs = await blogService.getPopularBlogs(1, 5);
	const images = await imageService.getImages();
	const users = await getUsers();
	let isCategoryFollowed = false;
	let isFollowingTabSelected = false;

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			content: marked.parse(blog.content),
			imagePath: images.find((img) => img.category === blog.category)
				?.transformedPath,
			date: moment(blog.createdAt).format('MMM DD, YYYY'),
			user: users.find(
				(user) => user._id.toString() === blog.userId.toString()
			),
			isPremium: blog.aiModel.includes('-4') ? true : false,
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
	const images = await imageService.getImages();
	const users = await getUsers();

	let isCategoryFollowed = false;

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			content: marked.parse(blog.content),
			imagePath: images.find((img) => img.category === blog.category)
				?.transformedPath,
			date: moment(blog.createdAt).format('MMM DD, YYYY'),
			user: users.find(
				(user) => user._id.toString() === blog.userId.toString()
			),
			isFollowingTabSelected: true,
			isPremium: blog.aiModel.includes('-4') ? true : false,
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
				imagePath = image.transformedPath;
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
			isLoggedIn: req.oidc.isAuthenticated(),
			authUser: req.oidc.user,
			userId: req?.userId,
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
				categoryImagePath: images.find((img) => img.category === category.name)
					?.transformedPath,
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
				imagePath: images.find((img) => img.category === blog.category)
					?.transformedPath,
				isPremium: blog.aiModel.includes('-4') ? true : false,
			};
		});

		res.render('blogs', {
			blogs: parsedBlogs,
			category: category,
			categoryImagePath: images.find((img) => img.category === category.name)
				?.transformedPath,
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
				categoryImagePath: images.find((img) => img.category === categoryName)
					?.transformedPath,
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
				imagePath: images.find((img) => img.category === blog.category)
					?.transformedPath,
				isPremium: blog.aiModel.includes('-4') ? true : false,
			};
		});

		res.render('blogs', {
			blogs: parsedBlogs,
			category: category,
			categoryImagePath: images.find((img) => img.category === categoryName)
				?.transformedPath,
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

export const genBlog = async (req, res) => {
	await generateBlog();
	res.json({ message: 'Gnerated' });
};
