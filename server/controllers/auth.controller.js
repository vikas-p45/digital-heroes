import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config/index.js';
import { signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/errors.js';
import { subscriptionView } from '../services/subscriptionState.js';
import * as Users from '../models/user.model.js';
import * as Charities from '../models/charity.model.js';

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
  charity_id: z.string().uuid().optional().nullable(),
  charity_percent: z.number().int().min(config.minCharityPercent, `Minimum contribution is ${config.minCharityPercent}%.`).max(100).default(config.minCharityPercent),
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, charity_id: u.charity_id, charity_percent: u.charity_percent,
});

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, charity_id, charity_percent } = req.body;
  if (charity_id && !(await Charities.isActive(charity_id))) throw new HttpError(400, 'That charity is not available.');
  let user;
  try {
    user = await Users.create({ name, email, passwordHash: await bcrypt.hash(password, 10), charityId: charity_id, charityPercent: charity_percent });
  } catch (e) {
    if (e.code === '23505') throw new HttpError(409, 'An account with this email already exists. Try logging in.');
    throw e;
  }
  res.status(201).json({ token: signToken(user), user: publicUser(user), subscription: subscriptionView(null) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findByEmail(email);
  // Same message for unknown email and wrong password, so accounts can't be probed.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new HttpError(401, 'Email or password is incorrect.');
  const full = await Users.findWithSubscription(user.id);
  res.json({ token: signToken(user), user: publicUser(user), subscription: subscriptionView(full) });
});

export const me = (req, res) => res.json({ user: publicUser(req.user), subscription: req.subscription });
