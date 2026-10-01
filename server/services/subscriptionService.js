import { tx, query } from '../config/db.js';
import { config } from '../config/index.js';
import { HttpError } from '../utils/errors.js';
import { getSettings } from './drawService.js';

export async function getPlans() {
  const { rows } = await query('select code, name, price_minor, interval_months, currency from plans where active order by interval_months');
  return rows;
}

export function activateSubscription(userId, planCode, { provider, record = true, providerCustomerId, providerSubscriptionId, providerRef } = {}) {
  return tx(async (c) => {
    const { rows: [plan] } = await c.query('select * from plans where code = $1 and active', [planCode]);
    if (!plan) throw new HttpError(400, 'Unknown plan.');
    const { rows: [user] } = await c.query('select id, charity_id, charity_percent from users where id = $1', [userId]);
    if (!user) throw new HttpError(404, 'User not found.');

    await c.query(
      `insert into subscriptions (user_id, plan_code, status, current_period_end, cancel_at_period_end, provider,
                                  provider_customer_id, provider_subscription_id, updated_at)
       values ($1, $2, 'active', now() + make_interval(months => $3), false, $4, $5, $6, now())
       on conflict (user_id) do update set
         plan_code = excluded.plan_code,
         status = 'active',
         current_period_end = greatest(subscriptions.current_period_end, now()) + make_interval(months => $3),
         cancel_at_period_end = false,
         provider = excluded.provider,
         provider_customer_id = coalesce(excluded.provider_customer_id, subscriptions.provider_customer_id),
         provider_subscription_id = coalesce(excluded.provider_subscription_id, subscriptions.provider_subscription_id),
         updated_at = now()`,
      [userId, planCode, plan.interval_months, provider || config.paymentProvider, providerCustomerId || null, providerSubscriptionId || null]
    );

    if (record) {
      const { poolPercent } = await getSettings(c);
      await c.query(
        `insert into payments (user_id, plan_code, amount_minor, charity_id, charity_percent, charity_amount_minor,
                               pool_amount_minor, provider, provider_ref)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId, planCode, plan.price_minor, user.charity_id, user.charity_percent,
          Math.floor((plan.price_minor * user.charity_percent) / 100),
          Math.floor((plan.price_minor * poolPercent) / 100),
          provider || config.paymentProvider, providerRef || null,
        ]
      );
    }
    return { plan: planCode };
  });
}

export async function endSubscription(userId) {
  await query(`update subscriptions set status = 'ended', current_period_end = now(), updated_at = now() where user_id = $1`, [userId]);
}

export async function setCancelAtPeriodEnd(userId, value) {
  const { rowCount } = await query(
    `update subscriptions set cancel_at_period_end = $2, updated_at = now() where user_id = $1 and status = 'active'`,
    [userId, value]
  );
  if (!rowCount) throw new HttpError(404, 'No active subscription found.');
}
