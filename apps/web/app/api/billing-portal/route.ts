import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// This assumes your STRIPE_SECRET_KEY is set in your environment variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Creates a Stripe Billing Portal session for an authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const authenticated = await auth();
    const userId=authenticated.userId;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { customerId } = await req.json();
    if (!customerId) {
      return new NextResponse('Stripe Customer ID is required.', { status: 400 });
    }

    // Define the return URL where the user will be sent after managing their subscription.
    const returnUrl = new URL('/settings/billing', req.nextUrl.origin).toString();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('[BILLING_PORTAL_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
