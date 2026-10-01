import { query } from '../config/db.js';

export async function overview() {
  const { rows } = await query(`select
    (select count(*)::int from users where role = 'subscriber') as total_users,
    (select count(*)::int from subscriptions where status = 'active' and current_period_end > now()) as active_subscribers,
    (select coalesce(sum(pool_total_minor), 0)::bigint from draws where status = 'published') as prize_pool_published,
    (select coalesce(sum(jackpot_rollover_out_minor), 0)::bigint from draws where status = 'published' and not rollover_consumed) as jackpot_rolling_over,
    (select coalesce(sum(charity_amount_minor), 0)::bigint from payments) as charity_from_subscriptions,
    (select coalesce(sum(amount_minor), 0)::bigint from donations) as charity_from_donations,
    (select coalesce(sum(amount_minor), 0)::bigint from payments) as revenue,
    (select count(*)::int from draws) as draws_total,
    (select count(*)::int from draws where status = 'published') as draws_published,
    (select count(*)::int from winnings) as winners_total,
    (select coalesce(sum(amount_minor), 0)::bigint from winnings where payment_status = 'paid') as paid_out,
    (select coalesce(sum(amount_minor), 0)::bigint from winnings where payment_status = 'pending') as payout_pending,
    (select count(*)::int from winnings where proof_status = 'submitted') as proofs_waiting`);
  return rows[0];
}

export async function charityBreakdown() {
  const { rows } = await query(`select c.id, c.name,
        coalesce(p.amt, 0)::bigint as subscriptions_minor, coalesce(d.amt, 0)::bigint as donations_minor,
        (select count(*)::int from users u where u.charity_id = c.id) as supporters
     from charities c
     left join (select charity_id, sum(charity_amount_minor) amt from payments group by 1) p on p.charity_id = c.id
     left join (select charity_id, sum(amount_minor) amt from donations group by 1) d on d.charity_id = c.id
     order by coalesce(p.amt, 0) + coalesce(d.amt, 0) desc, c.name limit 10`);
  return rows;
}
