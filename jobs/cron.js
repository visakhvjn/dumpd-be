import cron from 'node-cron';

import { generateBlog } from '../controllers/blogController.js';
import { generateTopic } from '../controllers/topicController.js';

cron.schedule('0 */6 * * *', async () => {
	console.log('⏰ Running daily blog generator...');

	try {
		await generateBlog();
		console.log('✅ Blog generated successfully!');
	} catch (err) {
		console.error('❌ Error generating blog:', err);
	}
});

cron.schedule('0 */3 * * *', async () => {
	console.log('⏰ Running topic generator...');

	try {
		await generateTopic();
		console.log('✅ Topic generated successfully!');
	} catch (err) {
		console.error('❌ Error generating topic:', err);
	}
});
