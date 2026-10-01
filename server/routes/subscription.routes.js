import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as c from '../controllers/subscription.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', c.current);
router.post('/checkout', validate(c.planSchema), c.checkout);
router.post('/mock-activate', validate(c.planSchema), c.mockActivate);
router.post('/cancel', c.cancel);
router.post('/resume', c.resume);
export default router;
