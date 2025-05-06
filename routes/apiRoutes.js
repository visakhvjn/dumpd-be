import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';

import {
	getUsers,
	getUser,
	getBlogs,
	getBlog,
} from '../controllers/apiController.js';
import * as apiKeyService from '../services/apiKeyService.js';

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
apiRouter.use(async (req, res, next) => {
	const userKey = req.headers['x-api-key'];

	if (!userKey) {
		return res.status(401).json({ message: 'Missing API key' });
	}

	if (!(await apiKeyService.isApiKeyValid(userKey))) {
		return res.status(401).json({ message: 'Invalid API key' });
	}

	// Update usage of the key by 1
	await apiKeyService.updateApiKey(userKey);

	next();
});

apiRouter.get('/users', getUsers);
apiRouter.get('/users/:userId', getUser);
apiRouter.get('/blogs', getBlogs);
apiRouter.get('/blogs/:blogIdOrSlug', getBlog);

export default apiRouter;
