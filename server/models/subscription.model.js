import { query } from '../config/db.js';

export const providerInfo = async (userId) =>
  (await query('select provider, provider_subscription_id from subscriptions where user_id = $1', [userId])).rows[0];

export const findByProviderSubscription = async (providerSubscriptionId) =>
  (await query('select user_id, plan_code from subscriptions where provider_subscription_id = $1', [providerSubscriptionId])).rows[0];

export const endByProviderSubscription = (providerSubscriptionId) =>
  query(`update subscriptions set status = 'ended', current_period_end = now() where provider_subscription_id = $1`, [providerSubscriptionId]);
