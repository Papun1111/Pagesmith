
import { clerkMiddleware, requireAuth as clerkRequireAuth } from '@clerk/express';
import type { Request, RequestHandler } from 'express';
import type { AuthObject } from '@clerk/backend';

export interface AuthenticatedRequest {
  auth: AuthObject;
}

/**
 * A stricter authentication middleware that protects routes.
 * It will throw an error if the user is not authenticated, which our
 * global error handler will catch and format as a 401 response.
 */
// FIX: Add explicit RequestHandler type to resolve the portability error.
export const requireAuth: RequestHandler = clerkRequireAuth();

/**
 * A flexible authentication middleware that simply identifies the user if they are logged in.
 */
// FIX: Add explicit RequestHandler type to resolve the portability error.
export const clerkAuth: RequestHandler = clerkMiddleware();

