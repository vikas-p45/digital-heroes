import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const where = first.path.length ? `${first.path.join('.')}: ` : '';
    return res.status(400).json({ error: `${where}${first.message}`, details: err.issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.code === '23505') return res.status(409).json({ error: 'That record already exists.' });
  if (err?.code === '23503') return res.status(409).json({ error: 'This record is linked to other data.' });
  if (err?.code === '22P02') return res.status(400).json({ error: 'Invalid identifier.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Upload is too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}

export function paging(req, max = 50) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(req.query.limit, 10) || 10));
  return { page, limit, offset: (page - 1) * limit };
}
