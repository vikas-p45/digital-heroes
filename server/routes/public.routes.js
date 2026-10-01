import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import * as c from '../controllers/public.controller.js';

const router = Router();
router.get('/config', c.getConfig);
router.get('/charities', c.listCharities);
router.get('/charities/:slug', c.getCharity);
router.post('/donations', optionalAuth, validate(c.donationSchema), c.donate);
router.get('/draws', c.listDraws);
router.get('/draws/upcoming', c.upcomingDraw);
export default router;
