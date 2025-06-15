import dotenv from 'dotenv';
dotenv.config();

export const createImage = async (prompt) => {
	try {
		const XAPIKEY = process.env.CF_WORKER_AI_API_KEY;
		const url = 'https://spring-snow-ab7e.vjnvisakh.workers.dev';

		const result = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': XAPIKEY,
				prompt: JSON.stringify(prompt),
			},
		});

		return result.json();
	} catch (error) {
		console.error('Error creating image:', error);
		throw new Error('Failed to create image');
	}
};
