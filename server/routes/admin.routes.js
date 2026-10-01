import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import * as c from '../controllers/admin.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/reports', c.reports);

router.get('/users', c.listUsers);
router.get('/users/:id', c.getUser);
router.patch('/users/:id', validate(c.userPatchSchema), c.patchUser);
router.patch('/users/:id/subscription', validate(c.subscriptionActionSchema), c.userSubscription);
router.post('/users/:id/scores', validate(c.scoreSchema), c.addUserScore);
router.put('/users/:id/scores/:scoreId', validate(c.scoreSchema), c.editUserScore);
router.delete('/users/:id/scores/:scoreId', c.removeUserScore);

router.get('/draw-settings', c.getDrawSettings);
router.put('/draw-settings', validate(c.settingsSchema), c.putDrawSettings);
router.get('/draws', c.listDraws);
router.post('/draws', validate(c.drawSchema), c.createDraw);
router.get('/draws/:id', c.getDraw);
router.patch('/draws/:id', validate(c.drawPatchSchema), c.patchDraw);
router.delete('/draws/:id', c.deleteDraw);
router.post('/draws/:id/simulate', validate(c.runSchema), c.simulateDraw);
router.post('/draws/:id/publish', validate(c.runSchema), c.publishDraw);

router.get('/charities', c.listCharities);
router.post('/charities', validate(c.charitySchema), c.createCharity);
router.put('/charities/:id', validate(c.charitySchema), c.updateCharity);
router.delete('/charities/:id', c.deleteCharity);

router.get('/winners', c.listWinners);
router.get('/winners/:id/proof', c.winnerProof);
router.post('/winners/:id/review', validate(c.reviewSchema), c.reviewWinner);
router.post('/winners/:id/pay', c.payWinner);

export default router;
