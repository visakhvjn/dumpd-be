import { marked } from 'marked';
import moment from 'moment';
import slugify from 'slugify';

import { blogModel } from '../models/Blog.js';
import { openai } from '../config/openai.js';
import { getRandomTopic } from './topicController.js';

export const generateBlog = async () => {
	try {
		const topic = await getRandomTopic();

		const response = await openai.chat.completions.create({
			model: 'gpt-4.1-nano',
			messages: [
				{ role: 'system', content: 'You are a tech blog writer' },
				{
					role: 'user',
					content: `
                Write a blog about a topic in technology related to ${topic.title}.
                
                The response should be a json object with title and content, categories and summary properties.
                The title should be a catchy title.
                The content should be a well-structured blog post with headings and subheadings.
                The blog should be informative and engaging.
                The blog should be around 500 words.
                The response should contain an array of categories that the blog belongs to.
                The summary should be in not more than 50 words.
            `,
				},
			],
		});

		const content = response.choices[0].message.content;
		const parsedContent = JSON.parse(content);

		const newBlog = new blogModel({
			title: parsedContent.title,
			content: parsedContent.content,
			createdAt: new Date(),
			slug: await getSlug(parsedContent.title.toLowerCase()),
			categories: parsedContent.categories,
			summary: parsedContent.summary,
		});

		await newBlog.save();
	} catch (err) {
		console.error('❌ Error generating blog:', err);
	}
};

export const getAllBlogs = async (req, res) => {
	const blogs = await blogModel.find({}).sort({ createdAt: -1 });

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			content: marked.parse(blog.content),
			date: moment(blog.createdAt).format('MMM DD, YYYY hh:mm A'),
		};
	});

	res.render('blogs', { blogs: parsedBlogs });
};

export const getBlog = async (req, res) => {
	const slug = req.params.slug;
	const blog = await blogModel.findOne({ slug: slug });

	const title = blog.title;
	const content = marked.parse(blog.content);
	const date = moment(blog.createdAt).format('MMM DD, YYYY hh:mm A');
	const categories = blog.categories;

	res.render('blog', { blog: { title, content, date, categories } });
};

export const getBlogsByCategory = async (req, res) => {
	const category = req.params.category;
	const blogs = await blogModel
		.find({ categories: new RegExp(`^${category}$`, 'i') })
		.sort({ createdAt: -1 });

	const parsedBlogs = blogs.map((blog) => {
		return {
			...blog._doc,
			summary: blog.summary,
			date: moment(blog.createdAt).format('MMM DD, YYYY hh:mm A'),
		};
	});

	res.render('blogs', { blogs: parsedBlogs });
};

const getSlug = async (title) => {
	let slug = slugify(title);
	let counter = 1;

	while (await blogModel.exists({ slug })) {
		slug = `${slug}-${counter++}`;
	}

	return slug;
};
