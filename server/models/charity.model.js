import { query } from '../config/db.js';

export async function listPublic({ q, featured, limit, offset }) {
  const where = ['active'];
  const params = [];
  if (q) { params.push(`%${q}%`); where.push(`(name ilike $${params.length} or description ilike $${params.length})`); }
  if (featured) where.push('featured');
  const w = where.join(' and ');
  const [items, total] = await Promise.all([
    query(`select id, name, slug, description, image_url, events, featured from charities where ${w}
           order by featured desc, name limit ${limit} offset ${offset}`, params),
    query(`select count(*)::int as count from charities where ${w}`, params),
  ]);
  return { items: items.rows, total: total.rows[0].count };
}

export async function findPublic(slugOrId) {
  const { rows } = await query(
    `select id, name, slug, description, image_url, events, featured from charities
     where active and (slug = $1 or id::text = $1)`, [slugOrId]);
  return rows[0];
}

export const isActive = async (id) => (await query('select 1 from charities where id = $1 and active', [id])).rowCount > 0;

export async function recordDonation({ userId, charityId, amountMinor, donorName, note }) {
  await query('insert into donations (user_id, charity_id, amount_minor, donor_name, note) values ($1,$2,$3,$4,$5)',
    [userId || null, charityId, amountMinor, donorName || null, note || null]);
}

export async function listAdmin({ limit, offset }) {
  const [items, total] = await Promise.all([
    query(`select * from charities order by created_at desc limit ${limit} offset ${offset}`),
    query('select count(*)::int as count from charities'),
  ]);
  return { items: items.rows, total: total.rows[0].count };
}

export async function slugTaken(slug) {
  return (await query('select 1 from charities where slug = $1', [slug])).rowCount > 0;
}

export async function create(c, slug) {
  const { rows } = await query(
    `insert into charities (name, slug, description, image_url, events, featured, active) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [c.name, slug, c.description, c.image_url || null, JSON.stringify(c.events), c.featured, c.active]);
  return rows[0];
}

export async function update(id, c) {
  const { rows } = await query(
    `update charities set name=$2, description=$3, image_url=$4, events=$5, featured=$6, active=$7 where id=$1 returning *`,
    [id, c.name, c.description, c.image_url || null, JSON.stringify(c.events), c.featured, c.active]);
  return rows[0];
}

export async function remove(id) {
  return (await query('delete from charities where id = $1', [id])).rowCount;
}
