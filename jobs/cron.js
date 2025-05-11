import cron from 'node-cron';

import { generateUser } from '../services/user.service.js';
import * as blogService from '../services/blog.service.js';

// Every half hour a new blog is added
cron.schedule('*/30 * * * *', async () => {
	console.log('⏰ Running daily blog generator...');

	try {
		await blogService.generateBlog();
		console.log('✅ Blog generated successfully!');
	} catch (err) {
		console.error('❌ Error generating blog:', err);
	}
});

// Every day at 10am a new user is added
cron.schedule('0 10 */1 * *', async () => {
	console.log('⏰ Running user generator...');

	try {
		await generateUser();
		console.log('✅ User generated successfully!');
	} catch (err) {
		console.error('❌ Error generating User:', err);
	}
});
