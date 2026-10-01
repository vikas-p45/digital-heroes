import { config } from '../config/index.js';
import { HttpError } from '../utils/errors.js';

let client;
async function stripe() {
  if (!config.stripe.secret) throw new HttpError(500, 'Stripe is not configured on the server.');
  if (!client) {
    const { default: Stripe } = await import('stripe');
    client = new Stripe(config.stripe.secret);
  }
  return client;
}

export async function createCheckoutSession({ user, planCode }) {
  const price = config.stripe.prices[planCode];
  if (!price) throw new HttpError(500, `No Stripe price is configured for the ${planCode} plan.`);
  const s = await stripe();
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { user_id: user.id, plan: planCode },
    subscription_data: { metadata: { user_id: user.id, plan: planCode } },
    success_url: `${config.clientUrls[0]}/dashboard?checkout=success`,
    cancel_url: `${config.clientUrls[0]}/subscribe?checkout=cancelled`,
  });
  return session.url;
}

export async function setStripeCancel(subscriptionId, value) {
  if (!subscriptionId) return;
  const s = await stripe();
  await s.subscriptions.update(subscriptionId, { cancel_at_period_end: value });
}

export async function constructEvent(rawBody, signature) {
  const s = await stripe();
  return s.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}
