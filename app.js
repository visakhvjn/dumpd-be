import express from 'express';
import helmet from 'helmet';
import { auth } from 'express-openid-connect';

import { connectDb } from './config/db.js';
import { auth0Config } from './config/auth0.js';

import blogRoutes from './routes/blog.routes.js';
import userRoutes from './routes/user.routes.js';
import apiRoutes from './routes/apiRoutes.js';
import categoryRoutes from './routes/category.routes.js';
import seriesRoutes from './routes/series.routes.js';
import { authoriseUser } from './controllers/user.controller.js';

import { scheduleCronJobs } from './jobs/cron.js';
import { generateSiteMap } from './scripts/sitemap.script.js';

export const app = express();

// app.use(helmet());

app.use(auth(auth0Config));

// starting cron jobs
scheduleCronJobs();

app.use(express.json());
app.use(
	express.static('public', {
		setHeaders: (res, filePath) => {
			if (filePath.endsWith('sitemap.xml')) {
				res.setHeader('Content-Type', 'application/xml');
			}
		},
	})
);

app.set('view engine', 'ejs');
app.set('views', './views');

// Connecting to the mongodb database
await connectDb();

// generate sitemap
await generateSiteMap();

// middleware to check if user is logged in via Auth0
app.use(authoriseUser);

app.use('/', blogRoutes);
app.use('/user', userRoutes);
app.use('/api', apiRoutes);
app.use('/categories', categoryRoutes);
app.use('/series', seriesRoutes);

app.all('*path', (req, res) => {
	res.status(404).render('404', { title: '404 Not Found' });
});

app.listen(3000);
