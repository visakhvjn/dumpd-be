import { openai } from '../config/openai.js';
import { topicModel } from '../models/Topic.js';
import * as topicService from '../services/topic.service.js';

export const generateTopic = async () => {
	try {
		const existingTopicsDb = await topicModel.find({}).sort({ createdAt: -1 });
		const existingTopics = existingTopicsDb.map((topic) => topic.title);

		const response = await openai.chat.completions.create({
			model: 'gpt-4.1-nano',
			messages: [
				{ role: 'system', content: 'You are a topic generator' },
				{
					role: 'user',
					content: `
				Generate a random topic in technology which is not present in the existing topics.
				Existing topics are ${existingTopics.join(', ')}.
				The response should be a json object with title property.
			`,
				},
			],
		});

		const content = response.choices[0].message.content;
		const parsedContent = JSON.parse(content);

		const newTopic = new topicModel({
			title: parsedContent.title,
		});

		await newTopic.save();
	} catch (err) {
		console.error('❌ Error generating topic:', err);
	}
};

export const getRandomTopic = async () => {
	try {
		const topics = await topicModel.find({}).sort({ createdAt: -1 });
		const randomIndex = Math.floor(Math.random() * topics.length);
		const randomTopic = topics[randomIndex];

		return randomTopic;
	} catch (err) {
		console.error('❌ Error fetching random topic:', err);
	}
};

export const getTopics = async (req, res) => {
	const topics = await topicService.getTopics();
	res.json(topics);
};
