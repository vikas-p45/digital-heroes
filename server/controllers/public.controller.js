import { z } from 'zod';
import { config } from '../config/index.js';
import { HttpError, asyncHandler, paging } from '../utils/errors.js';
import { getPlans } from '../services/subscriptionService.js';
import { getSettings, projectedPool } from '../services/drawService.js';
import * as Charities from '../models/charity.model.js';
import * as Draws from '../models/draw.model.js';

// Everything the marketing pages need in a single call.
export const getConfig = asyncHandler(async (req, res) => {
  const [plans, settings, pool] = await Promise.all([getPlans(), getSettings(), projectedPool()]);
  res.json({
    plans,
    minCharityPercent: config.minCharityPercent,
    poolPercent: settings.poolPercent,
    tierShares: settings.tierShares,
    paymentProvider: config.paymentProvider,
    activeSubscribers: pool.activeSubscribers,
    projectedPool: pool.poolTotal,
  });
});

export const listCharities = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 50);
  const { items, total } = await Charities.listPublic({
    q: String(req.query.q || '').trim(), featured: req.query.featured === 'true', limit, offset,
  });
  res.json({ items, total, page, limit });
});

export const getCharity = asyncHandler(async (req, res) => {
  const c = await Charities.findPublic(req.params.slug);
  if (!c) throw new HttpError(404, 'Charity not found.');
  res.json(c);
});

export const donationSchema = z.object({
  charity_id: z.string().uuid(),
  amount: z.number().positive('Enter an amount.').max(1000000),
  donor_name: z.string().trim().max(80).optional(),
  note: z.string().trim().max(300).optional(),
});

// Independent donation - not tied to gameplay or subscription.
export const donate = asyncHandler(async (req, res) => {
  const { charity_id, amount, donor_name, note } = req.body;
  if (!(await Charities.isActive(charity_id))) throw new HttpError(404, 'Charity not found.');
  await Charities.recordDonation({
    userId: req.user?.id, charityId: charity_id, amountMinor: Math.round(amount * 100),
    donorName: donor_name || req.user?.name, note,
  });
  res.status(201).json({ ok: true });
});

export const listDraws = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 24);
  const { items, total } = await Draws.listPublished({ limit, offset });
  res.json({ items, total, page, limit });
});

export const upcomingDraw = asyncHandler(async (req, res) => res.json(await Draws.upcoming()));
