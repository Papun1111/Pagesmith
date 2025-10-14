import { Router } from 'express';
import canvasRoutes from './canvasRoutes.js';

import geminiRoutes from './geminiRoutes.js';
import userRoutes from './userRoutes.js';
import razorpayRoutes from './razorpayRoutes.js'; // Change this import
const router: Router = Router();

// Mount the individual route modules under specific paths.
router.use('/canvases', canvasRoutes);
router.use('/billing', razorpayRoutes); 
router.use('/ai', geminiRoutes);
router.use('/user', userRoutes); // Mount the new user routes for profile fetching

// Note: The webhook route is handled separately in index.ts for raw body parsing.

export default router;
