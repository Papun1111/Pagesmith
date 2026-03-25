import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

if (!BACKEND_API_URL) {
    throw new Error("Missing required environment variable: BACKEND_API_URL");
}

export async function POST(req: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: 'Missing required payment verification fields.' },
        { status: 400 }
      );
    }

    // BACKEND_API_URL is http://localhost:8080 (no /api suffix).
    // The backend mounts routes at /api/billing/*.
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/billing/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // Always parse as JSON and return JSON
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { message: errorJson.message || 'Payment verification failed on the backend.' },
          { status: backendResponse.status }
        );
      } catch {
        return NextResponse.json(
          { message: errorText || `Backend responded with status: ${backendResponse.status}` },
          { status: backendResponse.status }
        );
      }
    }

    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await backendResponse.json();
      return NextResponse.json(data);
    } else {
      const responseText = await backendResponse.text();
      console.error("Received non-JSON response from backend:", responseText);
      return NextResponse.json(
        { message: 'Received an invalid response from the server.' },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('[RAZORPAY_VERIFY_PAYMENT_ERROR]', error);
    const message = error instanceof Error ? error.message : 'An internal server error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  }
}