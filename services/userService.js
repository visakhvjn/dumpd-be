import slugify from 'slugify';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { openai } from '../config/openai.js';
import { userModel } from '../models/User.js';

export const generateUser = async () => {
	const existingUsers = await getUsers();
	const existingUserNames = existingUsers.map((user) =>
		user.name.toLowerCase()
	);

	const response = await openai.chat.completions.create({
		model: 'gpt-4.1-nano',
		messages: [
			{
				role: 'system',
				content:
					'You are an AI that generates fictional personas for blog authors.',
			},
			{
				role: 'user',
				content: `
                        Create a detailed fictional persona for an AI-generated blog author.

                        The persona should include the following details:
                        - Name
                        - Writing Style (e.g., sarcastic, poetic, formal)
                        - Personality Traits (3–5 adjectives)
                        - Areas of Expertise (3–5 topics)
                        - A one-line author bio
						- gender - male or female

                        The response should be a json object with the following fields as an example -
                        {
                        "name": "John Doe",
                        "writingStyle": "sarcastic",
                        "personalityTraits": ["witty", "humorous", "insightful"],
                        "areasOfExpertise": ["technology", "lifestyle", "travel"],
                        "authorBio": "John Doe is a tech enthusiast who loves to explore the world.",
						"gender": "male"
                        }

                        The persona should be unique and engaging, suitable for a blog that covers a variety of topics related to technology.
                        Make sure the name is not already taken by an existing user.
                        The existing users are ${existingUserNames.join(', ')}.
                    `,
			},
		],
	});

	const user = JSON.parse(response.choices[0].message.content);
	await createUser(user);

	return user;
};

const createUser = async (userData) => {
	const newUser = {
		name: userData.name,
		writingStyle: userData.writingStyle,
		personalityTraits: userData.personalityTraits,
		areasOfExpertise: userData.areasOfExpertise,
		authorBio: userData.authorBio,
		slug: slugify(userData.name.toLowerCase()),
		profilePictureURL: await getRandomImageURL(userData.gender),
	};

	const user = await userModel.create(newUser);
	await user.save();

	return newUser;
};

export const getUsers = async () => {
	const users = await userModel.find({});
	return users;
};

export const getRandomUser = async () => {
	const users = await getUsers();
	const randomIndex = Math.floor(Math.random() * users.length);
	return users[randomIndex];
};

export const getUser = async (userId) => {
	const user = await userModel.findById(userId);

	if (!user) {
		throw Error('User not found!');
	}

	return user;
};

const getRandomImageURL = async (gender) => {
	const genderType = gender === 'male' ? 'men' : 'women';
	const randomNumber = Math.floor(Math.random() * 50);

	const fileUrl = `https://randomuser.me/api/portraits/${genderType}/${randomNumber}.jpg`;
	const fileName = `pic_${genderType}_${randomNumber}.jpg`;
	const imagePath = path.resolve('public/images', fileName);

	const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

	fs.writeFileSync(imagePath, response.data);

	return `/images/${fileName}`;
};

export const getUserBySlug = async (slug) => {
	const user = await userModel.findOne({
		slug,
	});

	return user;
};
