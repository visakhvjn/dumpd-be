import express from 'express';
import helmet from 'helmet';

import { connectDb } from './config/db.js';
import blogRoutes from './routes/blog.routes.js';
import userRoutes from './routes/user.routes.js';
import apiRoutes from './routes/apiRoutes.js';
import categoryRoutes from './routes/category.routes.js';

import './jobs/cron.js';

export const app = express();

// app.use(helmet());

app.use(express.json());
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './views');

// Connecting to the mongodb database
await connectDb();

// app.use((req, res, next) => {
// 	// Cache requests for 1 hour
// 	res.setHeader('Cache-Control', 'public, max-age=3600');
// 	next();
// });

app.use('/', blogRoutes);
app.use('/user', userRoutes);
app.use('/api', apiRoutes);
app.use('/categories', categoryRoutes);

app.get('/about', (req, res) => {
	res.render('about');
});

app.all('*path', (req, res) => {
	res.status(404).render('404', { title: '404 Not Found' });
});

app.listen(3000);
