import Stripe from 'stripe';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import User from '../models/User.js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const createCheckoutSession = async (clerkId: string, priceId: string, appUrl: string) => {
  const user = await User.findOne({ clerkId });
  if (!user) {
    throw new ApiError(404, 'User not found. Cannot create checkout session.');
  }

  try {
   
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { clerkId },
      success_url: `${appUrl}/dashboard?payment_success=true`,
      cancel_url: `${appUrl}/dashboard?payment_canceled=true`,
    };

    if (user.stripeCustomerId) {
      sessionParams.customer = user.stripeCustomerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return { url: session.url };
  } catch (error) {
    logger.error(`Stripe Checkout session creation failed for user ${clerkId}:`, error);
    throw new ApiError(500, 'Could not create Stripe checkout session.');
  }
};


export const handleSubscriptionChange = async (session: Stripe.Checkout.Session) => {
  const clerkId = session.metadata?.clerkId;
  if (!clerkId) {
    throw new ApiError(400, 'Webhook received without clerkId in metadata.');
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  if (!subscription.items.data || subscription.items.data.length === 0) {
    throw new ApiError(400, `Webhook for clerkId ${clerkId} received with no subscription items.`);
  }

  const priceId = subscription.items.data[0]?.price.id;


  const planMap: { [key: string]: 'free' | 'demon' | 'hashira' } = {
    [process.env.STRIPE_DEMON_PRICE_ID!]: 'demon',
    [process.env.STRIPE_HASHIRA_PRICE_ID!]: 'hashira',
  };
  if(priceId){
  const newPlan = planMap[priceId] || 'free';
 
  await User.findOneAndUpdate(
    { clerkId },
    {
      plan: newPlan,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
    },
    { new: true, upsert: false } 
  );

  logger.info(`User plan updated successfully for ${clerkId} to ${newPlan}.`);
}
};

