import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { hasAPIKey, isUserAuthorised } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', categoryController.getCategories);
router.get(
	'/:categoryId/users/:userId/follow',
	isUserAuthorised,
	categoryController.followCategory
);
router.get(
	'/:categoryId/users/:userId/unfollow',
	isUserAuthorised,
	categoryController.unfollowCategory
);
router.post('/', hasAPIKey, categoryController.createCategory);

export default router;
