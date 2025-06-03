import NodeCache from 'node-cache';
import slugify from 'slugify';
import crypto from 'crypto';
import dotenv from 'dotenv';

import { openai } from '../config/openai.js';

import { blogModel } from '../models/blog.model.js';
import * as userService from './user.service.js';
import * as categoryService from './category.service.js';
import * as Errors from '../utils/errors.js';
import * as makeService from './make.service.js';
import * as pineconeService from './pinecone.service.js';
import * as openaiService from './openai.service.js';
import * as devToService from './dev-to.service.js';

dotenv.config();

const cache = new NodeCache({ stdTTL: 3600 });

export const getBlogs = async (
	search = '',
	page = 1,
	size = 10,
	category = '',
	subcategory = '',
	userId = ''
) => {
	const skip = (page - 1) * size;
	let query = {};

	if (search) {
		query = { $text: { $search: search } };
	} else {
		if (category) {
			query = { category };
		}

		if (category && subcategory) {
			query = { category, subcategory };
		}

		if (userId) {
			query.userId = userId;
		}
	}

	const total = await blogModel.countDocuments(query);

	const blogs = await blogModel
		.find(query)
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(size);

	return { blogs, total };
};

export const getBlogsByFollowings = async (
	page = 1,
	size = 10,
	categories = []
) => {
	const skip = (page - 1) * size;
	let query = {};

	if (categories) {
		query = { category: { $in: categories } };
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
	const aiModel = getRandomAIModel();

	const response = await openai.chat.completions.create({
		model: aiModel,
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

	// A blog hash allows to check for duplicacy before saving.
	const blogHash = generateBlogHash(parsedContent.title, parsedContent.content);

	// check for duplicacy.
	const isBlogHashDuplicate = await doesBlogWithHashExist(blogHash);

	// if it is, we throw an error and skip saving
	if (isBlogHashDuplicate) {
		throw Errors.AppError(
			`Duplicate blog with title - ${parsedContent.title} was generated and skipped`
		);
	}

	const newBlog = await blogModel.create({
		title: parsedContent.title,
		content: parsedContent.content,
		createdAt: new Date(),
		slug: await getSlug(parsedContent.title.toLowerCase()),
		category,
		subcategory,
		summary: parsedContent.summary,
		userId: author._id,
		aiModel,
		hash: blogHash,
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
		The blog should not be more than 2000 words.
		The summary should be in not more than 200 words.

		Try to include code examples inside content when possible.
		Ensure that the code is properly indented and formatted.

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

const getRandomBlog = async () => {
	const blog = await blogModel.aggregate([
		{ $match: { isPosted: false } },
		{ $sample: { size: 1 } },
	]);
	return blog[0];
};

const getRandomBlogForDev = async () => {
	const blog = await blogModel.aggregate([
		{ $match: { isPostedToDev: false } },
		{ $sample: { size: 1 } },
	]);
	return blog[0];
};

const updateBlogToPosted = async (blogId) => {
	await blogModel.updateOne({ _id: blogId }, { $set: { isPosted: true } });
};

const updateBlogToPostedForDev = async (blogId) => {
	await blogModel.updateOne({ _id: blogId }, { $set: { isPostedToDev: true } });
};

export const postRandomBlog = async () => {
	const blog = await getRandomBlog();
	const summary = await summariseForLinkedIn(blog.content);

	await makeService.postBlogToLinkedIn(blog.title, summary, blog.slug);

	await updateBlogToPosted(blog._id);
};

const getRandomAIModel = () => {
	// lower models are repeated to get more weightage to minimise cost
	const aiModels = [
		'gpt-3.5-turbo',
		'gpt-3.5-turbo-16k',
		'gpt-4o-mini',
		'gpt-3.5-turbo',
		'gpt-3.5-turbo-16k',
		'gpt-4.1-mini',
		'gpt-3.5-turbo',
		'gpt-3.5-turbo-16k',
		'gpt-4.1-nano',
		'gpt-3.5-turbo-16k',
		'gpt-3.5-turbo',
		'gpt-3.5-turbo-16k',
		'gpt-4.1-nano',
	];

	const randomIndex = Math.floor(Math.random() * aiModels.length);
	return aiModels[randomIndex];
};

export const getBlogsForSitemapGeneration = async () => {
	return blogModel.find({}, { slug: 1, createdAt: 1 });
};

// generate a blog hash
// THe blog hash is generated using title and content
const generateBlogHash = (title, content) => {
	const normalizedTitle = title
		.replace(/\s+/g, '') // removes all white space
		.replace(/<[^>]+>/g, '') // removes all html tags
		.toLowerCase()
		.trim();

	const normalizedContent = content
		.replace(/\s+/g, '') // removes all white space
		.replace(/<[^>]+>/g, '') // removes all html tags
		.toLowerCase()
		.trim();

	const normalizedText = normalizedTitle + normalizedContent;

	return crypto.createHash('sha256').update(normalizedText).digest('hex');
};

const doesBlogWithHashExist = async (hash) => {
	const blog = await blogModel.findOne({ hash });
	return !!blog;
};

const summariseForLinkedIn = async (content) => {
	const prompt = `
		Summarise the following blog content for LinkedIn in not more than 200 words:
		${content}.

		Make sure to keep it engaging and professional.
		Make sure it is also suitable for a LinkedIn audience.
		Make sure it feels like a personal post from the author.

		Make sure to include relevant hashtags related to the content.

		Return a string with the summary and hashtags, separated by a newline.
	`;

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: 'You are a professional LinkedIn content writer.',
			},
			{
				role: 'user',
				content: prompt,
			},
		],
	});

	return response.choices[0].message.content.trim();
};

export const vectorizeBlogs = async () => {
	const blogArr = await blogModel.aggregate([
		{ $match: { isVectorized: false } },
		{ $sample: { size: 1 } },
	]);

	if (blogArr.length === 0) {
		console.log('No blogs to vectorize');
		return;
	}

	const blog = blogArr[0];

	await vectorizeContent(blog);

	await blogModel.updateOne(
		{ _id: blog._id },
		{ $set: { isVectorized: true } }
	);
};

const vectorizeContent = async (blog) => {
	if (!blog || !blog.content) {
		return;
	}

	const promises = [];

	const blogId = blog._id.toString();
	const content = blog.content.replace(/<[^>]+>/g, '');

	const chunks = chunkText(content, 200);

	if (chunks.length === 0) {
		console.warn(`No chunks created for blog ${blogId}`);
		return;
	}

	const records = [];

	for (let i = 0; i < chunks.length; i++) {
		promises.push(
			openaiService.createEmbedding(chunks[i]).then((embedding) => {
				records.push({
					id: `blog_${blogId}_chunk_${i}`,
					values: embedding,
					metadata: {
						blogId,
						chunkIndex: i,
						text: chunks[i],
					},
				});
			})
		);
	}

	await Promise.all(promises);

	if (records.length === 0) {
		console.warn(`No records created for blog ${blogId}`);
		return;
	}

	await pineconeService.addRecordsToPinecone(records);
};

const chunkText = (text, chunkSize = 150) => {
	const words = text.split(/\s+/);
	const chunks = [];

	for (let i = 0; i < words.length; i += chunkSize) {
		chunks.push(words.slice(i, i + chunkSize).join(' '));
	}

	return chunks;
};

export const queryBlog = async (blogId, query) => {
	const queryEmbedding = await openaiService.createEmbedding(query);
	const results = await pineconeService.queryRecords(queryEmbedding, {
		blogId,
	});

	const matchedChunks = results.map((result) => result.metadata.text);

	if (matchedChunks.length === 0) {
		return 'No relevant information found.';
	}

	const summary = await openaiService.summarizeQuery(query, matchedChunks);

	return summary;
};

export const postRandomBlogToDev = async () => {
	const blog = await getRandomBlogForDev();

	await devToService.postToDevTo(
		blog.title,
		blog.content,
		[],
		blog.category,
		`${process.env.BASE_URL}/blogs/${blog.slug}`
	);

	await updateBlogToPostedForDev(blog._id);
};
