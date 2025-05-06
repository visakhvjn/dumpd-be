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

apiRouter.get('/users', getUsers);
apiRouter.get('/users/:userId', getUser);
apiRouter.get('/blogs', getBlogs);
apiRouter.get('/blogs/:blogIdOrSlug', getBlog);

export default apiRouter;
