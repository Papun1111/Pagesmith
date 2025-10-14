import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const body = await req.json();

    const backendResponse = await fetch(`${process.env.BACKEND_API_URL}/api/billing/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    if (!backendResponse.ok) throw new Error(data.message);

    return NextResponse.json(data);
  } catch (error: unknown) {
    if(error instanceof Error)
    return new NextResponse(error.message, { status: 500 });
  }
}