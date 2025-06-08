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

	// Generate a new blog every 12 hours
	cron.schedule('0 */12 * * *', async () => {
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

	// every 12 hours new subcategories are added
	cron.schedule('0 */12 * * *', async () => {
		console.log('⏰ Generating New Subcategories ...');

		try {
			await categoryService.generateSubCategories();
			console.log('✅ New subcategories added');
		} catch (err) {
			console.error('❌ Error generating subcategories:', err);
		}
	});

	// every 3 hours vectorize blogs
	cron.schedule('0 */3 * * *', async () => {
		console.log('⏰ Vectorizing blogs ...');

		try {
			await blogService.vectorizeBlogs();
			console.log('✅ Blog vectorized!');
		} catch (err) {
			console.error('❌ Error vectorizing blog:', err);
		}
	});

	// Post a random blog to linkedin everyday at 10am
	cron.schedule('0 10 * * *', async () => {
		console.log('⏰ Posting to Dev.to');

		try {
			await blogService.postRandomBlogToDev();
			console.log('✅ Blog posted!');
		} catch (err) {
			console.error('❌ Error posting blog to dev.to:', err);
		}
	});
};
