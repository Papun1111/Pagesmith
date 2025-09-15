import { Router } from 'express';
import {
  handleCreateCheckout,
  handleStripeWebhook,
} from '../controllers/stripeController.js';

const router:Router = Router();

/**
 * Defines routes related to billing and subscriptions.
 */

// POST /api/billing/create-checkout-session - For authenticated users to start a subscription.
router.post('/create-checkout-session', handleCreateCheckout);

// POST /api/billing/webhooks/stripe - Public endpoint for receiving webhooks from Stripe.
// This route requires the raw body parser and is secured by signature verification in the controller.
router.post('/webhooks/stripe', handleStripeWebhook);

export default router;
