import { pool, tx } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import * as engine from './drawEngine.js';

const db = (c) => c ?? pool;

export async function getSettings(c) {
  const { rows } = await db(c).query('select pool_contribution_percent, tier_shares from draw_settings where id = 1');
  return { poolPercent: rows[0].pool_contribution_percent, tierShares: rows[0].tier_shares };
}

export async function updateSettings({ poolPercent, tierShares }) {
  await pool.query('update draw_settings set pool_contribution_percent = $1, tier_shares = $2 where id = 1', [
    poolPercent,
    JSON.stringify(tierShares),
  ]);
  return getSettings();
}

/** Every subscriber whose plan is live right now, with their latest five scores. */
async function loadActiveSubscribers(c) {
  const { rows } = await db(c).query(`
    select u.id as user_id, p.price_minor, p.interval_months,
           coalesce(array(select sc.score from scores sc where sc.user_id = u.id order by sc.played_on desc limit 5), '{}') as scores
    from subscriptions s
    join users u on u.id = s.user_id
    join plans p on p.code = s.plan_code
    where s.status = 'active' and s.current_period_end > now() and u.role = 'subscriber'`);
  return rows;
}

async function rolloverIn(c, excludeDrawId) {
  const { rows } = await db(c).query(
    `select coalesce(sum(jackpot_rollover_out_minor), 0) as v from draws
     where status = 'published' and rollover_consumed = false and id <> $1`,
    [excludeDrawId]
  );
  return Number(rows[0].v);
}

/** Current projected pool - used by reports and the public homepage. */
export async function projectedPool() {
  const settings = await getSettings();
  const subs = await loadActiveSubscribers();
  return { activeSubscribers: subs.length, poolTotal: engine.computePool(subs, settings.poolPercent) };
}

/**
 * The single calculation used by BOTH simulate and publish, so a simulation is
 * exactly what publishing would produce. It never writes - safe to re-run.
 */
async function compute(c, draw, { numbers, logic }) {
  const settings = await getSettings(c);
  const subs = await loadActiveSubscribers(c);
  const rollover = await rolloverIn(c, draw.id);
  const useLogic = logic ?? draw.logic;

  let drawn = numbers;
  if (drawn) {
    try { engine.assertValidNumbers(drawn); } catch (e) { throw new HttpError(422, e.message); }
  } else if (useLogic === 'algorithmic') {
    drawn = engine.weightedNumbers(engine.scoreFrequencies(subs.map((s) => s.scores)));
  } else {
    drawn = engine.randomNumbers();
  }

  const poolTotal = engine.computePool(subs, settings.poolPercent);
  const tierPools = engine.splitTiers(poolTotal, rollover, settings.tierShares);
  // Players need a full set of five scores to enter.
  const entrants = subs
    .filter((s) => s.scores.length === engine.PICK)
    .map((s) => ({ userId: s.user_id, scores: s.scores }));
  const result = engine.evaluate({ numbers: drawn, entries: entrants, tierPools });

  return {
    numbers: drawn,
    logic: useLogic,
    activeSubscribers: subs.length,
    eligibleEntrants: entrants.length,
    poolTotal,
    rolloverIn: rollover,
    tierPools,
    tierSummary: result.tierSummary,
    rolloverOut: result.rolloverOut,
    winners: result.winners,
    entries: result.entries,
  };
}

async function getDraw(c, id, lock = false) {
  const { rows } = await db(c).query(`select * from draws where id = $1 ${lock ? 'for update' : ''}`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Draw not found.');
  return rows[0];
}

export async function simulate(id, opts = {}) {
  const draw = await getDraw(null, id);
  if (draw.status === 'published') throw new HttpError(409, 'This draw is already published.');
  const preview = await compute(null, draw, opts);
  const ids = preview.winners.map((w) => w.userId);
  let names = {};
  if (ids.length) {
    const { rows } = await pool.query('select id, name, email from users where id = any($1::uuid[])', [ids]);
    names = Object.fromEntries(rows.map((r) => [r.id, r]));
  }
  // Do not send every entrant's scores back to the browser - only the summary.
  const { entries, ...rest } = preview;
  return {
    ...rest,
    winners: preview.winners.map((w) => ({ ...w, name: names[w.userId]?.name, email: names[w.userId]?.email })),
    matchDistribution: [0, 1, 2, 3, 4, 5].map((m) => ({ matches: m, players: entries.filter((e) => e.matches === m).length })),
  };
}

export function publish(id, opts = {}) {
  return tx(async (c) => {
    await c.query('select pg_advisory_xact_lock(4242)'); // one publish at a time keeps rollover consistent
    const draw = await getDraw(c, id, true);
    if (draw.status === 'published') throw new HttpError(409, 'This draw is already published.');

    const p = await compute(c, draw, opts);

    await c.query(
      `update draws set status = 'published', numbers = $2, logic = $3, active_subscribers = $4,
         pool_total_minor = $5, rollover_in_minor = $6, tier_pools = $7, jackpot_rollover_out_minor = $8,
         published_at = now() where id = $1`,
      [id, p.numbers, p.logic, p.activeSubscribers, p.poolTotal, p.rolloverIn, JSON.stringify(p.tierPools), p.rolloverOut]
    );
    // Earlier jackpot money has now been folded into this draw.
    await c.query(
      `update draws set rollover_consumed = true
       where status = 'published' and rollover_consumed = false and jackpot_rollover_out_minor > 0 and id <> $1`,
      [id]
    );
    if (p.entries.length) {
      await c.query(
        `insert into draw_entries (draw_id, user_id, scores, matches)
         select $1, (e->>'userId')::uuid, array(select x::int from jsonb_array_elements_text(e->'scores') x), (e->>'matches')::int
         from jsonb_array_elements($2::jsonb) e`,
        [id, JSON.stringify(p.entries)]
      );
    }
    if (p.winners.length) {
      await c.query(
        `insert into winnings (draw_id, user_id, tier, amount_minor)
         select $1, (w->>'userId')::uuid, (w->>'tier')::int, (w->>'amount')::bigint
         from jsonb_array_elements($2::jsonb) w`,
        [id, JSON.stringify(p.winners)]
      );
    }
    return { id, numbers: p.numbers, poolTotal: p.poolTotal, tierSummary: p.tierSummary, rolloverOut: p.rolloverOut };
  });
}
