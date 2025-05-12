import NodeCache from 'node-cache';
import slugify from 'slugify';

import { openai } from '../config/openai.js';

import { blogModel } from '../models/blog.model.js';
import * as userService from './user.service.js';
import * as categoryService from './category.service.js';
import * as Errors from '../utils/errors.js';

const cache = new NodeCache({ stdTTL: 3600 });

export const getBlogs = async (
	page = 1,
	size = 10,
	category = '',
	subcategory = '',
	userId = ''
) => {
	const skip = (page - 1) * size;
	let query = {};

	if (category) {
		query = { category };
	}

	if (category && subcategory) {
		query = { category, subcategory };
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

export const generateBlog = async () => {
	const { category, subcategory } =
		await categoryService.getRandomCategoryAndSubCategory();
	const author = await userService.getRandomUser();

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		temperature: author.creativityLevel,
		messages: [
			{
				role: 'system',
				content: getSystemPromptForBlog(author),
			},
			{
				role: 'user',
				content: getUserPromptForBlog(category, subcategory),
			},
		],
	});

	const content = response.choices[0].message.content;

	const parsedContent = JSON.parse(content);

	const newBlog = await blogModel.create({
		title: parsedContent.title,
		content: parsedContent.content,
		createdAt: new Date(),
		slug: await getSlug(parsedContent.title.toLowerCase()),
		category,
		subcategory,
		summary: parsedContent.summary,
		userId: author._id,
	});

	// update blog count for the category
	await categoryService.updateCategoryBlogCount(category);

	return newBlog;
};

export const getPopularBlogs = async (
	page = 1,
	size = 5,
	category = '',
	subcategory = '',
	userId = ''
) => {
	const skip = (page - 1) * size;
	let query = {};

	if (category) {
		query = { category };
	}

	if (category && subcategory) {
		query = { category, subcategory };
	}

	if (userId) {
		query.userId = userId;
	}

	const blogs = await blogModel
		.find(query)
		.sort({ views: -1 })
		.skip(skip)
		.limit(size);

	return blogs;
};

const getSystemPromptForBlog = (author) => {
	return `
		You are a tech blog writer named ${author.name}.
		Your writing style is ${author.writingStyle}.
		Your personality traits are ${author.personalityTraits.join(', ')}.
		And you are an expert in areas like ${author.areasOfExpertise.join(', ')}.
	`;
};

const getUserPromptForBlog = (category, subcategory) => {
	return `
		Write a blog about ${category} related to ${subcategory}.

		The response should be a **JSON object** with title, content and summary properties.

		The title should be a catchy title.
		The content should be a well-structured blog post with headings and subheadings.
		The blog should be informative and engaging.
		The blog should not be more than 1000 words.
		The summary should be in not more than 200 words.

		Try include code examples inside content when possible.

		Here is sample of how the response should look like 
		{
			"title": "A catchy title",
			"summary": "Too long hence don't read it",
			"content": "This is the <h1>entire</h1> content"
		}

		**DO NOT** include any other details. Make sure it is a valid JSON
	`;
};

const getSlug = async (title) => {
	let slug = slugify(title);
	let counter = 1;

	while (await blogModel.exists({ slug })) {
		slug = `${slug}-${counter++}`;
	}

	return slug;
};
