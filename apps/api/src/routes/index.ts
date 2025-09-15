import { Router } from 'express';
import canvasRoutes from './canvasRoutes.js';
import stripeRoutes from './stripeRoutes.js';
import geminiRoutes from './geminiRoutes.js';
import userRoutes from './userRoutes.js'; // Import the new user routes

const router: Router = Router();

// Mount the individual route modules under specific paths.
router.use('/canvases', canvasRoutes);
router.use('/billing', stripeRoutes);
router.use('/ai', geminiRoutes);
router.use('/webhooks', userRoutes); // Mount the user webhook routes

export default router;

