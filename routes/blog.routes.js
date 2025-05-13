import { Router } from 'express';

const router = Router();
import {
	getAllBlogs,
	getBlog,
	getBlogsByCategory,
	getBlogsBySubCategory,
} from '../controllers/blog.controller.js';

router.get('/', getAllBlogs);
router.get('/blogs/:slug', getBlog);
router.get('/blogs/categories/:category', getBlogsByCategory);
router.get(
	'/blogs/categories/:category/subcategories/:subcategory',
	getBlogsBySubCategory
);

export default router;
