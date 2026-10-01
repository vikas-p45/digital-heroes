import { query } from '../config/db.js';

export async function listPublished({ limit, offset }) {
  const [items, total] = await Promise.all([
    query(`select d.id, d.title, d.draw_month, d.logic, d.numbers, d.pool_total_minor, d.rollover_in_minor, d.tier_pools,
                  d.jackpot_rollover_out_minor, d.published_at,
                  (select count(*)::int from draw_entries e where e.draw_id = d.id) as entrants,
                  coalesce((select jsonb_object_agg(t.tier, t.n) from
                     (select tier, count(*)::int n from winnings w where w.draw_id = d.id group by tier) t), '{}'::jsonb) as winners_by_tier
           from draws d where d.status = 'published' order by d.draw_month desc, d.published_at desc limit ${limit} offset ${offset}`),
    query(`select count(*)::int as count from draws where status = 'published'`),
  ]);
  return { items: items.rows, total: total.rows[0].count };
}

export const upcoming = async () =>
  (await query(`select id, title, draw_month, logic from draws where status = 'draft' order by draw_month asc limit 1`)).rows[0] || null;

export async function listAdmin({ limit, offset }) {
  const [items, total] = await Promise.all([
    query(`select d.*, (select count(*)::int from draw_entries e where e.draw_id = d.id) as entrants,
                  (select count(*)::int from winnings w where w.draw_id = d.id) as winners
           from draws d order by d.draw_month desc, d.created_at desc limit ${limit} offset ${offset}`),
    query('select count(*)::int as count from draws'),
  ]);
  return { items: items.rows, total: total.rows[0].count };
}

// More than one draw per month is allowed - there is deliberately no unique constraint on the month.
export async function create({ title, draw_month, logic }) {
  const { rows } = await query(
    `insert into draws (title, draw_month, logic) values ($1, date_trunc('month', $2::date)::date, $3) returning *`,
    [title, draw_month, logic]);
  return rows[0];
}

export const findById = async (id) => (await query('select * from draws where id = $1', [id])).rows[0];

export async function updateDraft(id, { title, draw_month, logic }) {
  await query(
    `update draws set title = coalesce($2, title), draw_month = coalesce(date_trunc('month', $3::date)::date, draw_month),
            logic = coalesce($4, logic) where id = $1`, [id, title ?? null, draw_month ?? null, logic ?? null]);
}

export const removeDraft = async (id) =>
  (await query(`delete from draws where id = $1 and status = 'draft'`, [id])).rowCount;

export async function winnersOf(id) {
  const { rows } = await query(
    `select w.id, w.tier, w.amount_minor, w.proof_status, w.payment_status, u.name, u.email
     from winnings w join users u on u.id = w.user_id where w.draw_id = $1 order by w.tier desc, u.name`, [id]);
  return rows;
}

export const entriesCount = async (userId) =>
  (await query('select count(*)::int as n from draw_entries where user_id = $1', [userId])).rows[0].n;

export async function lastResultFor(userId) {
  const { rows } = await query(
    `select d.id, d.title, d.draw_month, d.numbers, e.matches, e.scores
     from draw_entries e join draws d on d.id = e.draw_id where e.user_id = $1
     order by d.draw_month desc, d.published_at desc limit 1`, [userId]);
  return rows[0] || null;
}
