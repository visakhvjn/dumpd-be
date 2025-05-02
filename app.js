import express from 'express';
import helmet from 'helmet';

import { connectDb } from './config/db.js';
import blogRoutes from './routes/blogRoutes.js';
import './jobs/cron.js';

const app = express();

app.use(helmet());

app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', './views');

// Connecting to the mongodb database
await connectDb();

app.use('/', blogRoutes);

// app.all('*', (req, res) => {
// 	res.send('Not Found');
// });

app.listen(3000);
