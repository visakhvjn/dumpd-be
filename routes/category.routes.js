import { Router } from 'express';
import * as categoryRoutes from '../controllers/category.controller.js';

const router = Router();

router.get('/', categoryRoutes.getCategories);

export default router;
