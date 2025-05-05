import express from 'express';

import { getUsers } from '../controllers/apiController.js';

const apiRouter = new express.Router();

apiRouter.get('/users', getUsers);

export default apiRouter;
