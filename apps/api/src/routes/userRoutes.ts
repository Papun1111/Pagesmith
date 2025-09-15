import { Router } from 'express';
import { clerkWebhookHandler } from '../controllers/userController.js';

const router:Router = Router();

/**
 * Defines the webhook endpoint for Clerk.
 * This is a public route, but it's secured by Svix signature verification
 * inside the controller. It's crucial that the raw body parser is applied
 * to this route in the main server file.
 */
router.post('/clerk', clerkWebhookHandler);

export default router;
