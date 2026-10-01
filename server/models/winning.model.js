import { query } from '../config/db.js';

export async function forUser(userId) {
  const { rows } = await query(
    `select w.id, w.tier, w.amount_minor, w.proof_status, w.payment_status, w.admin_note, w.created_at,
            d.title as draw_title, d.draw_month, d.numbers
     from winnings w join draws d on d.id = w.draw_id where w.user_id = $1 order by w.created_at desc`, [userId]);
  return rows;
}

export const findOwned = async (id, userId) =>
  (await query('select id, proof_status from winnings where id = $1 and user_id = $2', [id, userId])).rows[0];

export const submitProof = (id, image) =>
  query(`update winnings set proof_image = $2, proof_status = 'submitted', admin_note = null where id = $1`, [id, image]);

export async function listAdmin({ proof, payment, limit, offset }) {
  const where = [];
  const params = [];
  if (['none', 'submitted', 'approved', 'rejected'].includes(proof)) { params.push(proof); where.push(`w.proof_status = $${params.length}`); }
  if (['pending', 'paid'].includes(payment)) { params.push(payment); where.push(`w.payment_status = $${params.length}`); }
  const w = where.length ? `where ${where.join(' and ')}` : '';
  const [items, total] = await Promise.all([
    // proof_image is heavy, so lists only flag whether a proof exists; it is fetched on demand.
    query(`select w.id, w.tier, w.amount_minor, w.proof_status, w.payment_status, w.admin_note, w.created_at, w.paid_at,
                  (w.proof_image is not null) as has_proof, u.name, u.email, d.title as draw_title
           from winnings w join users u on u.id = w.user_id join draws d on d.id = w.draw_id
           ${w} order by (w.proof_status = 'submitted') desc, w.created_at desc limit ${limit} offset ${offset}`, params),
    query(`select count(*)::int as count from winnings w ${w}`, params),
  ]);
  return { items: items.rows, total: total.rows[0].count };
}

export const proofImage = async (id) =>
  (await query('select proof_image from winnings where id = $1', [id])).rows[0]?.proof_image;

export async function review(id, status, note) {
  return (await query(
    `update winnings set proof_status = $2, admin_note = $3 where id = $1 and proof_status = 'submitted'`,
    [id, status, note || null])).rowCount;
}

export async function markPaid(id) {
  return (await query(
    `update winnings set payment_status = 'paid', paid_at = now()
     where id = $1 and proof_status = 'approved' and payment_status = 'pending'`, [id])).rowCount;
}
