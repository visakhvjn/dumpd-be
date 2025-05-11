import { Router } from 'express';
import * as categoryRoutes from '../controllers/category.controller.js';

const router = Router();

router.get('/', categoryRoutes.getCategories);
router.post('/', categoryRoutes.createCategory);
router.patch('/:id', categoryRoutes.updateCategory);

export default router;
