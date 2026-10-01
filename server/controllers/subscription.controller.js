import express from 'express';
import { z } from 'zod';
import { config } from '../config/index.js';
import { HttpError, asyncHandler } from '../utils/errors.js';
import { activateSubscription, setCancelAtPeriodEnd } from '../services/subscriptionService.js';
import * as stripeProvider from '../services/stripeProvider.js';
import * as Subscriptions from '../models/subscription.model.js';

export const planSchema = z.object({ plan: z.enum(['monthly', 'yearly']) });

export const current = (req, res) => res.json(req.subscription);

export const checkout = asyncHandler(async (req, res) => {
  if (config.paymentProvider === 'stripe') {
    const url = await stripeProvider.createCheckoutSession({ user: req.user, planCode: req.body.plan });
    return res.json({ mode: 'stripe', url });
  }
  res.json({ mode: 'mock', url: `/checkout/mock?plan=${req.body.plan}` });
});

// Built-in test checkout. Disabled automatically when PAYMENT_PROVIDER=stripe.
export const mockActivate = asyncHandler(async (req, res) => {
  if (config.paymentProvider !== 'mock') throw new HttpError(403, 'Test checkout is disabled.');
  await activateSubscription(req.user.id, req.body.plan, { provider: 'mock', providerRef: `mock_${Date.now()}` });
  res.json({ ok: true });
});

async function changeCancel(req, res, value) {
  const info = await Subscriptions.providerInfo(req.user.id);
  if (info?.provider === 'stripe') await stripeProvider.setStripeCancel(info.provider_subscription_id, value);
  await setCancelAtPeriodEnd(req.user.id, value);
  res.json({ ok: true });
}
export const cancel = asyncHandler((req, res) => changeCancel(req, res, true));
export const resume = asyncHandler((req, res) => changeCancel(req, res, false));

/** Stripe webhook. Mounted in app.js BEFORE express.json() because it needs the raw body. */
export const stripeWebhook = [
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    let event;
    try {
      event = await stripeProvider.constructEvent(req.body, req.headers['stripe-signature']);
    } catch {
      return res.status(400).send('Invalid signature');
    }
    const obj = event.data.object;
    if (event.type === 'checkout.session.completed') {
      const userId = obj.metadata?.user_id || obj.client_reference_id;
      if (userId && obj.metadata?.plan) {
        await activateSubscription(userId, obj.metadata.plan, {
          provider: 'stripe', providerCustomerId: obj.customer, providerSubscriptionId: obj.subscription, providerRef: obj.id,
        });
      }
    } else if (event.type === 'invoice.paid' && obj.billing_reason === 'subscription_cycle') {
      const s = await Subscriptions.findByProviderSubscription(obj.subscription);
      if (s) await activateSubscription(s.user_id, s.plan_code, { provider: 'stripe', providerRef: obj.id });
    } else if (event.type === 'customer.subscription.deleted') {
      await Subscriptions.endByProviderSubscription(obj.id);
    }
    res.json({ received: true });
  }),
];
