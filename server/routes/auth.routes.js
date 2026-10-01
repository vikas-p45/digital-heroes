import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as c from '../controllers/auth.controller.js';

const router = Router();
router.post('/signup', validate(c.signupSchema), c.signup);
router.post('/login', validate(c.loginSchema), c.login);
router.get('/me', authenticate, c.me);
export default router;
