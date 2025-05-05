import express from 'express';

import { getUsers, getUser } from '../controllers/apiController.js';

const apiRouter = new express.Router();

apiRouter.get('/users', getUsers);
apiRouter.get('/users/:userId', getUser);

export default apiRouter;
