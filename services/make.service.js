import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

export const postBlogToLinkedIn = async (title, summary, slug) => {
	const link = `${process.env.BASE_URL}/blogs/${slug}`;

	const payload = {
		data: { title, summary, link },
	};

	try {
		const response = await axios.post(process.env.MAKE_WEBHOOK_URL, payload, {
			headers: {
				'Content-Type': 'application/json',
			},
		});
		console.log('✅ Webhook POST successful:', response.data);
		return response.data;
	} catch (error) {
		console.error('❌ Error posting to webhook:', error.message);
		throw error;
	}
};
