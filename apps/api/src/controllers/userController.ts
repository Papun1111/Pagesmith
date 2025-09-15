import type { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { createOrUpdateUser } from '../services/userService.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

// --- Define Interfaces for Clerk Webhook Payloads ---
// This ensures type safety for the data received from Clerk.

interface UserWebhookData {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  first_name: string | null;
  last_name: string | null;
  image_url: string;
}

interface UserCreatedEvent {
  type: 'user.created';
  data: UserWebhookData;
}

interface UserUpdatedEvent {
  type: 'user.updated';
  data: UserWebhookData;
}

type ClerkWebhookEvent = UserCreatedEvent | UserUpdatedEvent;

/**
 * Controller to handle incoming webhooks from Clerk.
 * Specifically handles 'user.created' and 'user.updated' events to sync user data.
 *
 * IMPORTANT: This endpoint requires the raw request body for signature verification.
 * In your main server file (e.g., index.ts), you must apply the raw body parser
 * for this specific route: `app.use('/api/webhooks/clerk', express.raw({ type: 'application/json' }))`.
 */
export const clerkWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET is not set.');
    return next(new ApiError(500, 'Webhook secret is not configured.'));
  }

  // Use the Svix library to verify the webhook signature.
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    // The svix library needs the raw body (as a string) and the headers.
    const payloadString = req.body.toString('utf8');
    const svixHeaders = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };
    evt = wh.verify(payloadString, svixHeaders) as ClerkWebhookEvent;
  } catch (err: any) {
    logger.error('Clerk webhook signature verification failed:', err.message);
    // Return a 400 Bad Request if the signature is invalid.
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle the 'user.created' and 'user.updated' events.
  const eventType = evt.type;
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      // Call the service to create or update the user in the database.
      await createOrUpdateUser({
        clerkId: id,
        email: email_addresses[0]?.email_address??"",
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      });

      logger.info(`Successfully processed '${eventType}' webhook for Clerk ID: ${id}`);
    } catch (error) {
      // Pass any database-related errors to the global error handler.
      return next(error);
    }
  }

  res.status(200).json({ message: 'Webhook processed successfully.' });
};

