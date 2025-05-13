import { Router } from 'express';

import {
	getAllBlogs,
	getAllFollowingBlogs,
	getBlog,
	getBlogsByCategory,
	getBlogsBySubCategory,
} from '../controllers/blog.controller.js';
import { isUserAuthorised } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getAllBlogs);
router.get('/following', isUserAuthorised, getAllFollowingBlogs);
router.get('/blogs/:slug', getBlog);
router.get('/blogs/categories/:category', getBlogsByCategory);
router.get(
	'/blogs/categories/:category/subcategories/:subcategory',
	getBlogsBySubCategory
);

export default router;
