import { pool, tx } from '../config/db.js';
import { HttpError } from '../utils/errors.js';

export const MAX_SCORES = 5;
const today = () => new Date().toISOString().slice(0, 10);

export async function listScores(userId, client = pool) {
  const { rows } = await client.query(
    'select id, score, played_on, created_at from scores where user_id = $1 order by played_on desc limit $2',
    [userId, MAX_SCORES]
  );
  return rows;
}

function assertNotFuture(playedOn) {
  if (playedOn > today()) throw new HttpError(422, 'Score date cannot be in the future.');
}

// Serialise writes per user so two quick requests can never leave 6 rows behind.
const lockUser = (c, userId) => c.query('select id from users where id = $1 for update', [userId]);

/**
 * Add a score. Rules:
 *   one score per date (unique constraint + friendly message)
 *   only the latest 5 by date are kept; adding a 6th removes the oldest automatically
 *   a score dated older than all five stored ones is rejected (it would be the one dropped)
 */
export function addScore(userId, { score, played_on }) {
  assertNotFuture(played_on);
  return tx(async (c) => {
    await lockUser(c, userId);
    const dup = await c.query('select 1 from scores where user_id = $1 and played_on = $2', [userId, played_on]);
    if (dup.rowCount) throw new HttpError(409, 'You already have a score for that date. Edit or delete it instead.');

    const { rows: existing } = await c.query(
      'select id, played_on from scores where user_id = $1 order by played_on asc',
      [userId]
    );
    if (existing.length >= MAX_SCORES) {
      if (played_on < existing[0].played_on) {
        throw new HttpError(422, 'That date is older than your latest five scores, so it would not be kept.');
      }
      const excess = existing.length - MAX_SCORES + 1;
      const toDelete = existing.slice(0, excess).map((r) => r.id);
      await c.query('delete from scores where id = any($1::uuid[])', [toDelete]);
    }
    await c.query('insert into scores (user_id, score, played_on) values ($1, $2, $3)', [userId, score, played_on]);
    return listScores(userId, c);
  });
}

export function updateScore(userId, scoreId, { score, played_on }) {
  assertNotFuture(played_on);
  return tx(async (c) => {
    await lockUser(c, userId);
    const { rowCount } = await c.query(
      'update scores set score = $3, played_on = $4 where id = $1 and user_id = $2',
      [scoreId, userId, score, played_on]
    );
    if (!rowCount) throw new HttpError(404, 'Score not found.');
    return listScores(userId, c);
  });
}

export async function deleteScore(userId, scoreId) {
  const { rowCount } = await pool.query('delete from scores where id = $1 and user_id = $2', [scoreId, userId]);
  if (!rowCount) throw new HttpError(404, 'Score not found.');
  return listScores(userId);
}
