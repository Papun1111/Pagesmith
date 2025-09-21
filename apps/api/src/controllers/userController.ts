import type { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { createOrUpdateUser, findUserByClerkId } from '../services/userService.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import { getAuth } from '@clerk/express';

// ... existing webhook interfaces and clerkWebhookHandler function ...

// --- Interfaces for Webhook ---
interface UserWebhookData {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  first_name: string | null;
  last_name: string | null;
  image_url: string;
}
interface UserCreatedEvent { type: 'user.created'; data: UserWebhookData; }
interface UserUpdatedEvent { type: 'user.updated'; data: UserWebhookData; }
type ClerkWebhookEvent = UserCreatedEvent | UserUpdatedEvent;

export const clerkWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
  // ... existing clerkWebhookHandler logic ...
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET is not set.');
    return next(new ApiError(500, 'Webhook secret is not configured.'));
  }
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;
  try {
    const payloadString = req.body.toString('utf8');
    const svixHeaders = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };
    evt = wh.verify(payloadString, svixHeaders) as ClerkWebhookEvent;
  } catch (err: any) {
    logger.error('Clerk webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }
  const eventType = evt.type;
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    try {
      const userData: {
        clerkId: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string;
        email?: string;
      } = { clerkId: id, firstName: first_name, lastName: last_name, imageUrl: image_url };
      const primaryEmail = email_addresses[0]?.email_address;
      if (primaryEmail) { userData.email = primaryEmail; }
      await createOrUpdateUser(userData);
      logger.info(`Successfully processed '${eventType}' webhook for Clerk ID: ${id}`);
    } catch (error) {
      return next(error);
    }
  }
  res.status(200).json({ message: 'Webhook processed successfully.' });
};


/**
 * Controller to get the profile of the currently authenticated user.
 */
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return next(new ApiError(401, 'User is not authenticated.'));
    }
    const userProfile = await findUserByClerkId(userId);
    res.status(200).json(userProfile);
  } catch (error) {
    next(error);
  }
};
