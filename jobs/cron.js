import cron from 'node-cron';

import { generateUser } from '../services/user.service.js';
import * as blogService from '../services/blog.service.js';
import { generateCategoryAndSubcategoryImage } from '../services/category.service.js';

const jobs = [];

export const scheduleCronJobs = () => {
	if (process.env.NODE_ENV !== 'production') {
		console.log(`Cronjob scheduling is skipped on ${process.env.NODE_ENV}`);
		return;
	}

	console.log(`scheduling cron jobs on ${process.env.NODE_ENV}`);

	const blogJob = cron.schedule('0 * * * *', async () => {
		console.log('⏰ Running daily blog generator...');

		try {
			await blogService.generateBlog();
			console.log('✅ Blog generated successfully!');
		} catch (err) {
			console.error('❌ Error generating blog:', err);
		}
	});

	const userJob = cron.schedule('0 10 */1 * *', async () => {
		console.log('⏰ Running user generator...');

		try {
			await generateUser();
			console.log('✅ User generated successfully!');
		} catch (err) {
			console.error('❌ Error generating User:', err);
		}
	});

	const subCategoryImageJob = cron.schedule('* * * * *', async () => {
		console.log('⏰ Running user generator...');

		try {
			const hasGenerated = await generateCategoryAndSubcategoryImage();

			if (hasGenerated) {
				console.log('✅ Image generated successfully!');
			}
		} catch (err) {
			console.error('❌ Error generating Image:', err);
		}
	});

	jobs.push(blogJob, userJob);
};
