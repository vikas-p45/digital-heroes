import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './auth.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import meRoutes from './me.routes.js';
import adminRoutes from './admin.routes.js';
import publicRoutes from './public.routes.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

const router = Router();
router.use('/auth', authLimiter, authRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/me', meRoutes);
router.use('/admin', adminRoutes);
router.use('/', publicRoutes);
export default router;
