import { z } from 'zod';
import { config } from '../config/index.js';
import { HttpError, asyncHandler, paging } from '../utils/errors.js';
import { addScore, updateScore, deleteScore, listScores } from '../services/scoreService.js';
import { activateSubscription, endSubscription } from '../services/subscriptionService.js';
import * as drawService from '../services/drawService.js';
import * as engine from '../services/drawEngine.js';
import * as Users from '../models/user.model.js';
import * as Charities from '../models/charity.model.js';
import * as Draws from '../models/draw.model.js';
import * as Winnings from '../models/winning.model.js';
import * as Reports from '../models/report.model.js';

const uuid = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date.');

/* ───────── schemas ───────── */
export const scoreSchema = z.object({ score: z.number().int().min(1).max(45), played_on: dateStr });
export const userPatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(['subscriber', 'admin']).optional(),
  charity_id: uuid.nullable().optional(),
  charity_percent: z.number().int().min(config.minCharityPercent).max(100).optional(),
});
export const subscriptionActionSchema = z.object({ action: z.enum(['grant', 'end']), plan: z.enum(['monthly', 'yearly']).optional() });
export const settingsSchema = z.object({
  poolPercent: z.number().int().min(1).max(100),
  tierShares: z.object({ 5: z.number().min(0), 4: z.number().min(0), 3: z.number().min(0) }),
});
export const drawSchema = z.object({
  title: z.string().trim().min(2).max(100),
  draw_month: dateStr,
  logic: z.enum(['random', 'algorithmic']),
});
export const drawPatchSchema = drawSchema.partial();
export const runSchema = z.object({
  logic: z.enum(['random', 'algorithmic']).optional(),
  numbers: z.array(z.number().int().min(engine.SCORE_MIN).max(engine.SCORE_MAX)).length(engine.PICK).optional(),
});
export const charitySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(3000).default(''),
  image_url: z.string().trim().url().max(500).optional().or(z.literal('')).nullable(),
  events: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    date: z.string().trim().max(40).optional().default(''),
    location: z.string().trim().max(120).optional().default(''),
  })).max(20).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});
export const reviewSchema = z.object({ decision: z.enum(['approve', 'reject']), note: z.string().trim().max(300).optional() });

/* ───────── reports ───────── */
export const reports = asyncHandler(async (req, res) => {
  const [totals, charities, pool] = await Promise.all([Reports.overview(), Reports.charityBreakdown(), drawService.projectedPool()]);
  res.json({ ...totals, projected_pool: pool.poolTotal, charities });
});

/* ───────── users ───────── */
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 100);
  const { items, total } = await Users.list({ q: String(req.query.q || '').trim(), limit, offset });
  res.json({ items, total, page, limit });
});

export const getUser = asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id);
  const user = await Users.detail(id);
  if (!user) throw new HttpError(404, 'User not found.');
  res.json({ user, scores: await listScores(id) });
});

export const patchUser = asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id);
  if (id === req.user.id && req.body.role && req.body.role !== 'admin') throw new HttpError(400, "You can't remove your own admin role.");
  if (!(await Users.update(id, req.body))) throw new HttpError(404, 'User not found.');
  res.json({ ok: true });
});

export const userSubscription = asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id);
  if (req.body.action === 'grant') {
    if (!req.body.plan) throw new HttpError(400, 'Choose a plan to grant.');
    await activateSubscription(id, req.body.plan, { provider: 'admin', record: false });
  } else {
    await endSubscription(id);
  }
  res.json({ ok: true });
});

// Admins can correct a player's scores. The same rolling-5 rules apply.
export const addUserScore = asyncHandler(async (req, res) => res.status(201).json(await addScore(uuid.parse(req.params.id), req.body)));
export const editUserScore = asyncHandler(async (req, res) => res.json(await updateScore(uuid.parse(req.params.id), uuid.parse(req.params.scoreId), req.body)));
export const removeUserScore = asyncHandler(async (req, res) => res.json(await deleteScore(uuid.parse(req.params.id), uuid.parse(req.params.scoreId))));

/* ───────── draws ───────── */
export const getDrawSettings = asyncHandler(async (req, res) => res.json(await drawService.getSettings()));

export const putDrawSettings = asyncHandler(async (req, res) => {
  const { tierShares } = req.body;
  const sum = tierShares[5] + tierShares[4] + tierShares[3];
  if (Math.round(sum * 100) !== 10000) throw new HttpError(400, `Tier shares must add up to 100% (currently ${sum}%).`);
  res.json(await drawService.updateSettings(req.body));
});

export const listDraws = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 50);
  const { items, total } = await Draws.listAdmin({ limit, offset });
  res.json({ items, total, page, limit });
});
export const createDraw = asyncHandler(async (req, res) => res.status(201).json(await Draws.create(req.body)));

export const patchDraw = asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id);
  const d = await Draws.findById(id);
  if (!d) throw new HttpError(404, 'Draw not found.');
  if (d.status !== 'draft') throw new HttpError(409, 'Published draws cannot be edited.');
  await Draws.updateDraft(id, req.body);
  res.json({ ok: true });
});

export const deleteDraw = asyncHandler(async (req, res) => {
  if (!(await Draws.removeDraft(uuid.parse(req.params.id)))) throw new HttpError(409, 'Only draft draws can be deleted.');
  res.json({ ok: true });
});

export const getDraw = asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id);
  const draw = await Draws.findById(id);
  if (!draw) throw new HttpError(404, 'Draw not found.');
  res.json({ draw, winners: await Draws.winnersOf(id) });
});

export const simulateDraw = asyncHandler(async (req, res) => res.json(await drawService.simulate(uuid.parse(req.params.id), req.body)));
export const publishDraw = asyncHandler(async (req, res) => res.json(await drawService.publish(uuid.parse(req.params.id), req.body)));

/* ───────── charities ───────── */
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'charity';

export const listCharities = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 100);
  const { items, total } = await Charities.listAdmin({ limit, offset });
  res.json({ items, total, page, limit });
});

export const createCharity = asyncHandler(async (req, res) => {
  let slug = slugify(req.body.name);
  if (await Charities.slugTaken(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  res.status(201).json(await Charities.create(req.body, slug));
});

export const updateCharity = asyncHandler(async (req, res) => {
  const row = await Charities.update(uuid.parse(req.params.id), req.body);
  if (!row) throw new HttpError(404, 'Charity not found.');
  res.json(row);
});

export const deleteCharity = asyncHandler(async (req, res) => {
  if (!(await Charities.remove(uuid.parse(req.params.id)))) throw new HttpError(404, 'Charity not found.');
  res.json({ ok: true });
});

/* ───────── winners ───────── */
export const listWinners = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req, 100);
  const { items, total } = await Winnings.listAdmin({ proof: req.query.proof, payment: req.query.payment, limit, offset });
  res.json({ items, total, page, limit });
});

export const winnerProof = asyncHandler(async (req, res) => {
  const image = await Winnings.proofImage(uuid.parse(req.params.id));
  if (!image) throw new HttpError(404, 'No proof uploaded.');
  res.json({ image });
});

export const reviewWinner = asyncHandler(async (req, res) => {
  const status = req.body.decision === 'approve' ? 'approved' : 'rejected';
  if (status === 'rejected' && !req.body.note) throw new HttpError(400, 'Add a short note so the winner knows what to fix.');
  if (!(await Winnings.review(uuid.parse(req.params.id), status, req.body.note))) {
    throw new HttpError(409, 'There is no submitted proof to review for this winner.');
  }
  res.json({ ok: true });
});

export const payWinner = asyncHandler(async (req, res) => {
  if (!(await Winnings.markPaid(uuid.parse(req.params.id)))) {
    throw new HttpError(409, 'Approve the proof first - only approved winners can be marked paid.');
  }
  res.json({ ok: true });
});
