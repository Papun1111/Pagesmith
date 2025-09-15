import type { Response, NextFunction, Request } from 'express';
import { getAuth } from '@clerk/express';
import Stripe from 'stripe';
import * as BillingService from '../services/billingService.js';
import { logger } from '../utils/logger.js';

/**
 * Creates a Stripe Checkout session for a user to start a subscription.
 * This function is called when a user clicks an "Upgrade" button on the frontend.
 */
export const handleCreateCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use getAuth(req) to securely get the userId from the authenticated session.
    const { userId } = getAuth(req);
    const { priceId } = req.body;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated to create a checkout session.' });
    }
    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required.' });
    }

    const session = await BillingService.createCheckoutSession(userId, priceId, appUrl);
    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles incoming webhooks from Stripe to update subscription status.
 * This endpoint must be configured in your Stripe Dashboard.
 */
export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // The request body must be the raw buffer for verification.
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.warn('Stripe webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event, which occurs after a successful payment.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await BillingService.handleSubscriptionChange(session);
    } catch (error) {
      return next(error);
    }
  }

  res.status(200).json({ received: true });
};

