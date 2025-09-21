import Stripe from 'stripe';
import { findUserByClerkId } from './userService.js'; // Import the new, robust find function
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

// Initialize Stripe with the secret key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Creates a Stripe Checkout session for a user to subscribe to a plan.
 * It uses the findUserByClerkId service to handle just-in-time user creation.
 */
export const createCheckoutSession = async (clerkId: string, priceId: string, appUrl: string) => {
  if (!clerkId) {
    throw new ApiError(401, 'User is not authenticated.');
  }

  // FIX: Use the robust findUserByClerkId function which handles the
  // race condition by creating the user if they don't exist.
  const user = await findUserByClerkId(clerkId);
  const { stripeCustomerId } = user;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { clerkId },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
  };

  // If the user is already a Stripe customer, pass the customer ID.
  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return { url: session.url };
  } catch (error: any) {
    logger.error("Stripe session creation failed:", error);
    throw new ApiError(500, `Stripe Error: ${error.message}`);
  }
};

/**
 * Handles subscription changes from Stripe webhooks.
 */
export const handleSubscriptionChange = async (session: Stripe.Checkout.Session) => {
  const clerkId = session.metadata?.clerkId;
  if (!clerkId) {
    throw new ApiError(400, 'Clerk ID not found in Stripe session metadata.');
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  if (!subscription.items.data || subscription.items.data.length === 0) {
      throw new ApiError(400, 'Subscription has no items.');
  }
  
  const priceId = subscription.items.data[0]?.price.id;

  let plan: 'free' | 'demon' | 'hashira' = 'free';
  if (priceId === process.env.STRIPE_DEMON_PRICE_ID) {
    plan = 'demon';
  } else if (priceId === process.env.STRIPE_HASHIRA_PRICE_ID) {
    plan = 'hashira';
  }

  await User.findOneAndUpdate(
    { clerkId },
    {
      plan,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeSubscriptionStatus: subscription.status,
    },
    { upsert: true } // Use upsert in case the webhook arrives before user creation.
  );

  logger.info(`Subscription updated for user ${clerkId} to plan: ${plan}`);
};

