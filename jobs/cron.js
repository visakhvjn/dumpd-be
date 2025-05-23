import cron from 'node-cron';

import { generateUser } from '../services/user.service.js';
import * as blogService from '../services/blog.service.js';
import * as categoryService from '../services/category.service.js';

export const scheduleCronJobs = () => {
	if (process.env.NODE_ENV !== 'production') {
		console.log(`Cronjob scheduling is skipped on ${process.env.NODE_ENV}`);
		return;
	}

	console.log(`scheduling cron jobs on ${process.env.NODE_ENV}`);

	// Generate a new blog every hour
	cron.schedule('0 * * * *', async () => {
		console.log('⏰ Running daily blog generator...');

		try {
			await blogService.generateBlog();
			console.log('✅ Blog generated successfully!');
		} catch (err) {
			console.error('❌ Error generating blog:', err);
		}
	});

	// Generate a new user at 10am every day
	cron.schedule('0 10 */1 * *', async () => {
		console.log('⏰ Running user generator...');

		try {
			await generateUser();
			console.log('✅ User generated successfully!');
		} catch (err) {
			console.error('❌ Error generating User:', err);
		}
	});

	// Post a random blog to linkedin everyday at 10am
	cron.schedule('0 10 * * *', async () => {
		console.log('⏰ Running Blog poster...');

		try {
			await blogService.postRandomBlog();
			console.log('✅ Blog POST successful:');
		} catch (err) {
			console.error('❌ Error generating Image:', err);
		}
	});

	// every 5 hours new subcategories are added
	cron.schedule('0 */5 * * *', async () => {
		console.log('⏰ Generating New Subcategories ...');

		try {
			await categoryService.generateSubCategories();
			console.log('✅ New subcategories added');
		} catch (err) {
			console.error('❌ Error generating subcategories:', err);
		}
	});
};
