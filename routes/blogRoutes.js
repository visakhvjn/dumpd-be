import { Router } from 'express';

const router = Router();
import {
	getAllBlogs,
	getBlog,
	getBlogsByCategory,
	genBlog,
	getBlogsByUser,
} from '../controllers/blogController.js';

router.get('/', getAllBlogs);
router.get('/blogs/:slug', getBlog);
router.get('/blogs/category/:category', getBlogsByCategory);
router.get('/blogs/user/:userSlug', getBlogsByUser);

export default router;
