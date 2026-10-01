import { z } from 'zod';
import { query } from '../config/db.js';
import { config } from '../config/index.js';
import { HttpError, asyncHandler } from '../utils/errors.js';
import { addScore, updateScore, deleteScore, listScores } from '../services/scoreService.js';
import { getPlans } from '../services/subscriptionService.js';
import * as Charities from '../models/charity.model.js';
import * as Draws from '../models/draw.model.js';
import * as Winnings from '../models/winning.model.js';

export const scoreSchema = z.object({
  score: z.number({ invalid_type_error: 'Enter a score.' }).int('Score must be a whole number.').min(1, 'Score must be between 1 and 45.').max(45, 'Score must be between 1 and 45.'),
  played_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date.'),
});
export const profileSchema = z.object({ name: z.string().trim().min(2).max(80) });
export const charitySchema = z.object({
  charity_id: z.string().uuid(),
  charity_percent: z.number().int().min(config.minCharityPercent, `Minimum contribution is ${config.minCharityPercent}%.`).max(100),
});
export const proofSchema = z.object({
  image: z.string().startsWith('data:image/', 'Upload a PNG, JPG or WebP screenshot.').max(2_200_000, 'Image is too large (max 1.5 MB).'),
});

export const dashboard = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const [scores, charity, entered, winnings, upcoming, lastResult, plans] = await Promise.all([
    listScores(uid),
    req.user.charity_id ? Charities.findPublic(req.user.charity_id) : null,
    Draws.entriesCount(uid),
    Winnings.forUser(uid),
    Draws.upcoming(),
    Draws.lastResultFor(uid),
    getPlans(),
  ]);
  const plan = plans.find((p) => p.code === req.subscription.plan);
  const monthly = plan ? plan.price_minor / plan.interval_months : 0;
  res.json({
    user: { id: uid, name: req.user.name, email: req.user.email, role: req.user.role },
    subscription: req.subscription,
    scores,
    charity: {
      id: charity?.id || null, name: charity?.name || null, slug: charity?.slug || null,
      percent: req.user.charity_percent,
      monthlyContributionMinor: Math.floor((monthly * req.user.charity_percent) / 100),
    },
    participation: {
      drawsEntered: entered,
      upcomingDraw: upcoming,
      lastResult,
      eligible: req.subscription.hasAccess && scores.length === 5,
    },
    winnings: {
      totalWonMinor: winnings.reduce((t, w) => t + Number(w.amount_minor), 0),
      paidMinor: winnings.filter((w) => w.payment_status === 'paid').reduce((t, w) => t + Number(w.amount_minor), 0),
      items: winnings,
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  await query('update users set name = $2 where id = $1', [req.user.id, req.body.name]);
  res.json({ ok: true });
});

export const updateCharity = asyncHandler(async (req, res) => {
  if (!(await Charities.isActive(req.body.charity_id))) throw new HttpError(400, 'That charity is not available.');
  await query('update users set charity_id = $2, charity_percent = $3 where id = $1', [req.user.id, req.body.charity_id, req.body.charity_percent]);
  res.json({ ok: true });
});

export const getScores = asyncHandler(async (req, res) => res.json(await listScores(req.user.id)));
export const createScore = asyncHandler(async (req, res) => res.status(201).json(await addScore(req.user.id, req.body)));
export const editScore = asyncHandler(async (req, res) => res.json(await updateScore(req.user.id, req.params.id, req.body)));
export const removeScore = asyncHandler(async (req, res) => res.json(await deleteScore(req.user.id, req.params.id)));

// Screenshot is stored as a data URL (max ~1.5 MB). Swap for Supabase Storage if volume grows.
export const uploadProof = asyncHandler(async (req, res) => {
  const w = await Winnings.findOwned(req.params.id, req.user.id);
  if (!w) throw new HttpError(404, 'Winning not found.');
  if (!['none', 'rejected'].includes(w.proof_status)) throw new HttpError(409, 'Proof was already submitted for this win.');
  await Winnings.submitProof(w.id, req.body.image);
  res.json({ ok: true });
});
