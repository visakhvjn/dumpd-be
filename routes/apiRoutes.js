import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';

import {
	getUsers,
	getUser,
	getBlogs,
	getBlog,
} from '../controllers/apiController.js';

const apiRouter = new express.Router();

// Load Swagger specification from YAML file
const swaggerDocument = yaml.load('./swagger.yml');

// Initialize Swagger UI
apiRouter.use(
	'/docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerDocument, {
		customfavIcon: '/icons/bot_favicon.png',
		customSiteTitle: 'AI Blog - API Documentation',
		customCssUrl: '/css/swagger.css',
	})
);

// Middleware to restrict if no api key is present
apiRouter.use((req, res, next) => {
	const userKey = req.headers['x-api-key'];

	if (!userKey) {
		return res.status(401).json({ message: 'Invalid or missing API key' });
	}

	next();
});

apiRouter.get('/users', getUsers);
apiRouter.get('/users/:userId', getUser);
apiRouter.get('/blogs', getBlogs);
apiRouter.get('/blogs/:blogIdOrSlug', getBlog);

export default apiRouter;
