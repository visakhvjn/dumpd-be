import { Router } from 'express';
import * as seriesController from '../controllers/series.controller.js';

const router = Router();

router.get('/', seriesController.getSeries);
router.post('/', seriesController.createSeries);
router.post('/generate', seriesController.generateSeries);
router.get('/:slug', seriesController.getSeriesBySlug);

export default router;
