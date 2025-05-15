import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

import * as blogService from '../services/blog.service.js';

dotenv.config();

export const generateSiteMap = async () => {
	if (process.env.NODE_ENV !== 'production') {
		return;
	}

	const blogs = await blogService.getBlogsForSitemapGeneration();
	const baseUrl = process.env.BASE_URL;

	const urls = blogs.map((blog) => {
		return `
  <url>
    <loc>${baseUrl}/blogs/${encodeURIComponent(blog.slug)}</loc>
    <lastmod>${new Date(blog.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
	});

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	const filePath = path.resolve('public', 'sitemap.xml');
	fs.writeFileSync(filePath, sitemap, 'utf8');
	console.log('✅ sitemap.xml generated');
};
