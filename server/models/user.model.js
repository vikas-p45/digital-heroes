import { query } from '../config/db.js';
import { USER_WITH_SUB_SQL } from '../services/subscriptionState.js';

// Effective subscription status, computed in SQL for admin lists.
export const SUB_STATUS_SQL = `case when s.plan_code is null then 'inactive'
  when s.status = 'active' and s.current_period_end > now() then (case when s.cancel_at_period_end then 'cancelling' else 'active' end)
  else 'lapsed' end`;

export const findByEmail = async (email) =>
  (await query('select * from users where lower(email) = $1', [email])).rows[0];

export const findWithSubscription = async (id) =>
  (await query(`${USER_WITH_SUB_SQL} where u.id = $1`, [id])).rows[0];

export async function create({ name, email, passwordHash, charityId, charityPercent }) {
  const { rows } = await query(
    `insert into users (name, email, password_hash, charity_id, charity_percent) values ($1,$2,$3,$4,$5)
     returning id, name, email, role, charity_id, charity_percent`,
    [name, email, passwordHash, charityId || null, charityPercent]
  );
  return rows[0];
}

export async function list({ q, limit, offset }) {
  const params = [];
  let where = 'true';
  if (q) { params.push(`%${q}%`); where = '(u.name ilike $1 or u.email ilike $1)'; }
  const [items, total] = await Promise.all([
    query(`select u.id, u.name, u.email, u.role, u.created_at, u.charity_percent, c.name as charity_name,
                  s.plan_code, s.current_period_end, ${SUB_STATUS_SQL} as sub_status
           from users u left join subscriptions s on s.user_id = u.id left join charities c on c.id = u.charity_id
           where ${where} order by u.created_at desc limit ${limit} offset ${offset}`, params),
    query(`select count(*)::int as count from users u where ${where}`, params),
  ]);
  return { items: items.rows, total: total.rows[0].count };
}

export async function detail(id) {
  const { rows } = await query(
    `select u.id, u.name, u.email, u.role, u.created_at, u.charity_id, u.charity_percent, s.plan_code,
            s.current_period_end, s.cancel_at_period_end, s.provider, ${SUB_STATUS_SQL} as sub_status
     from users u left join subscriptions s on s.user_id = u.id where u.id = $1`, [id]);
  return rows[0];
}

const EDITABLE = ['name', 'role', 'charity_id', 'charity_percent'];
export async function update(id, fields) {
  const entries = Object.entries(fields).filter(([k]) => EDITABLE.includes(k));
  if (!entries.length) return 1;
  const sets = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ');
  const { rowCount } = await query(`update users set ${sets} where id = $1`, [id, ...entries.map(([, v]) => v)]);
  return rowCount;
}
