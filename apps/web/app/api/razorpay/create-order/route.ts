/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Get the backend URL from environment variables and add a check for it.
const BACKEND_API_URL = process.env.BACKEND_API_URL;

// This check runs when the server starts. If the variable is missing,
// it will throw a clear error, preventing runtime failures.
if (!BACKEND_API_URL) {
    throw new Error("Missing required environment variable: BACKEND_API_URL");
}

export async function POST(req: NextRequest) {
  try {
    const { getToken } =await auth();
    const token = await getToken();
    const { plan } = await req.json();

    // FIX: The BACKEND_API_URL environment variable already includes '/api',
    // so it has been removed from this path to prevent duplication.
    const backendResponse = await fetch(`${BACKEND_API_URL}/billing/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });

    // If the response is not OK, try to parse a JSON error, otherwise use the text.
    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || 'Failed to create order on the backend.');
        } catch {
            // If the error response itself is not JSON, throw the raw text.
            throw new Error(errorText || `Backend responded with status: ${backendResponse.status}`);
        }
    }

    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
    } else {
        const responseText = await backendResponse.text();
        console.error("Received non-JSON response from backend:", responseText);
        throw new Error("Received an invalid response from the server. This may be due to an authentication issue.");
    }

  } catch (error: any) {
    console.error('[RAZORPAY_CREATE_ORDER_ERROR]', error);
    // Always return a valid JSON response, even on error.
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

