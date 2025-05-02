import { Router } from 'express';

const router = Router();
import {
	getAllBlogs,
	getBlog,
	getBlogsByCategory,
} from '../controllers/blogController.js';

router.get('/', getAllBlogs);
router.get('/blogs/:slug', getBlog);
router.get('/blogs/category/:category', getBlogsByCategory);

export default router;
