import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../config/db.js';
import { HttpError, asyncHandler } from '../utils/errors.js';
import { subscriptionView, USER_WITH_SUB_SQL } from '../services/subscriptionState.js';

export const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpires });

async function load(req, { required }) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    if (required) throw new HttpError(401, 'Please log in to continue.');
    return;
  }
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    if (required) throw new HttpError(401, 'Your session has expired. Please log in again.');
    return;
  }
  // Role + subscription are read fresh from the DB on every request.
  const { rows } = await query(`${USER_WITH_SUB_SQL} where u.id = $1`, [payload.sub]);
  if (!rows[0]) {
    if (required) throw new HttpError(401, 'Account not found. Please log in again.');
    return;
  }
  req.user = rows[0];
  req.subscription = subscriptionView(rows[0]);
}

export const authenticate = asyncHandler(async (req, res, next) => {
  await load(req, { required: true });
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  await load(req, { required: false });
  next();
});

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Admin access only.'));
  next();
};

export const requireSubscriber = (req, res, next) => {
  if (!req.subscription?.hasAccess) {
    return next(new HttpError(402, 'An active subscription is required for this feature.'));
  }
  next();
};
