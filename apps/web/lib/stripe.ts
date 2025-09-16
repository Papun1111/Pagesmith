import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;


export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!stripePublicKey) {
      console.error("Stripe public key is not set. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file.");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};
