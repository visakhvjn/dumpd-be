import express from 'express';

import { getUsers, getUser, getBlogs } from '../controllers/apiController.js';

const apiRouter = new express.Router();

apiRouter.get('/users', getUsers);
apiRouter.get('/users/:userId', getUser);
apiRouter.get('/blogs', getBlogs);

export default apiRouter;
