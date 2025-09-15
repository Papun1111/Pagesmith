import { clerkMiddleware, requireAuth as clerkRequireAuth } from '@clerk/express';
import type { RequestHandler } from 'express';

export const requireAuth: RequestHandler = clerkRequireAuth();

export const clerkAuth: RequestHandler = clerkMiddleware();

