import cron from 'node-cron';

import { generateTopic } from '../controllers/topicController.js';
import { generateUser } from '../services/user.service.js';
import * as blogService from '../services/blog.service.js';

// Every 20 hours a new blog is added
// cron.schedule('*/5 * * * *', async () => {
// 	console.log('⏰ Running daily blog generator...');

// 	try {
// 		await blogService.generateBlog();
// 		console.log('✅ Blog generated successfully!');
// 	} catch (err) {
// 		console.error('❌ Error generating blog:', err);
// 	}
// });

// Every 12 hours a new topic is added
cron.schedule('0 */12 * * *', async () => {
	console.log('⏰ Running topic generator...');

	try {
		await generateTopic();
		console.log('✅ Topic generated successfully!');
	} catch (err) {
		console.error('❌ Error generating topic:', err);
	}
});

// Every 3rd day at 10am a new user is added
cron.schedule('0 10 */3 * *', async () => {
	console.log('⏰ Running user generator...');

	try {
		await generateUser();
		console.log('✅ User generated successfully!');
	} catch (err) {
		console.error('❌ Error generating User:', err);
	}
});
