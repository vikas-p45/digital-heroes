import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, requireSubscriber } from '../middleware/auth.js';
import * as c from '../controllers/me.controller.js';

const router = Router();
router.use(authenticate);
router.get('/dashboard', c.dashboard);
router.patch('/profile', validate(c.profileSchema), c.updateProfile);
router.patch('/charity', validate(c.charitySchema), c.updateCharity);

// Entering/editing scores needs a live subscription; deleting is always allowed.
router.get('/scores', c.getScores);
router.post('/scores', requireSubscriber, validate(c.scoreSchema), c.createScore);
router.put('/scores/:id', requireSubscriber, validate(c.scoreSchema), c.editScore);
router.delete('/scores/:id', c.removeScore);

router.post('/winnings/:id/proof', validate(c.proofSchema), c.uploadProof);
export default router;
