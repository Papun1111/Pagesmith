import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Use an environment variable for your backend URL.
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';

/**
 * Handles POST requests to the /api/gemini endpoint.
 * This route securely proxies requests from the client to your backend AI service.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user and get their session token.
    const author= await auth();
    const userId=author.userId;
    if (!userId) {
      return new NextResponse('Unauthorized: User not authenticated.', { status: 401 });
    }
    const token = await author.getToken();

    // 2. Extract the prompt from the incoming request body.
    const { prompt } = await req.json();
    if (!prompt) {
      return new NextResponse('A valid prompt is required.', { status: 400 });
    }

    // 3. Securely forward the request to your backend service.
    // The full URL should be http://localhost:8080/api/ai/generate
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include the user's token in the Authorization header.
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    // 4. Handle non-successful responses from the backend.
    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      return new NextResponse(errorBody || 'Failed to get response from AI service.', {
        status: backendResponse.status,
      });
    }

    // 5. If the backend call was successful, return its response to the client.
    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[GEMINI_API_ROUTE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

