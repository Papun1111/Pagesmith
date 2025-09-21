import { Router } from 'express';
import { clerkWebhookHandler, getUserProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router :Router= Router();

// This is an authenticated route to get the user's own profile.
// It will be accessed at GET /api/user/profile
router.get('/profile', requireAuth, getUserProfile);

// This is the public webhook route for Clerk.
// It will be accessed at POST /api/webhooks/clerk
router.post('/clerk', clerkWebhookHandler);

export default router;
