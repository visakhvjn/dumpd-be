import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const postToDevTo = async (
	title,
	content,
	tags,
	series,
	canonicalURL
) => {
	const article = {
		article: {
			title,
			published: true,
			body_markdown: content,
			tags,
			series,
			canonical_url: canonicalURL,
		},
	};

	try {
		await axios.post(process.env.DEV_POST_URL, article, {
			headers: {
				'Content-Type': 'application/json',
				'api-key': process.env.DEV_API_KEY,
			},
		});
	} catch (err) {
		throw new Error('Error posting to dev.to', err);
	}
};
