import { Router } from 'express';

const router = Router();
import {
	getAllBlogs,
	getBlog,
	getBlogsByCategory,
	getBlogsByUser,
	generateBlog,
} from '../controllers/blogController.js';

router.get('/', getAllBlogs);
router.get('/blogs/generate', generateBlog);
router.get('/blogs/:slug', getBlog);
router.get('/blogs/categories/:category', getBlogsByCategory);
router.get('/blogs/user/:userSlug', getBlogsByUser);

export default router;
