import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * A secure Next.js API route to create a Stripe Checkout session.
 * It acts as a proxy to your backend, ensuring no secret keys are exposed to the client.
 */
export async function POST(req: NextRequest) {
  try {
    
    const authData = await auth();
    if (!authData.userId) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const { priceId } = await req.json();
    if (!priceId) {
      return NextResponse.json({ message: 'Price ID is required.' }, { status: 400 });
    }

    const token = await authData.getToken();
    if (!token) {
        return NextResponse.json({ message: 'Session token not found.' }, { status: 401 });
    }

    // Securely call the backend to create the checkout session.
    const backendResponse = await fetch(`${API_BASE_URL}/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ priceId }),
    });

    if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        return NextResponse.json({ message: errorData.message || 'Backend API error' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    // Return the session URL to the frontend.
    return NextResponse.json(data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('[CHECKOUT_API_ROUTE] Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

