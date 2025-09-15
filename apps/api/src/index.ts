import 'dotenv/config'; // Ensures environment variables are loaded first.
import express from 'express';
import http from 'http';
import cors from 'cors';

// --- Configurations and Initializers ---
import { connectDB } from './config/index.js';
import { initializeSocketIO } from './socket/index.js';

// --- Middleware ---
import { requireAuth } from './middleware/auth.js';
import { planBasedRateLimiter } from './middleware/rateLimiter.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

// --- Route Handlers ---
import apiRoutes from './routes/index.js';
import userRoutes from './routes/userRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';

// --- 1. Initial Server Setup ---
connectDB(); // Establish database connection on startup.
const app = express();
const httpServer = http.createServer(app);

// Enable CORS for your frontend application.
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' }));


// --- 2. Webhook Route Configuration (Crucial Order) ---
// These routes for Clerk and Stripe webhooks MUST use a raw body parser.
// They are placed before the global `express.json()` to avoid parsing the body beforehand.
app.use('/api/webhooks/clerk', express.raw({ type: 'application/json' }), userRoutes);
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeRoutes);


// --- 3. Global JSON Body Parser ---
// This middleware will parse the body of all subsequent incoming requests into JSON.
app.use(express.json());


// --- 4. Authenticated API Routes ---
// All routes defined in `apiRoutes` will be mounted under the '/api' path.
// They are protected by authentication and a plan-based rate limiter.
app.use('/api', requireAuth, planBasedRateLimiter, apiRoutes);


// --- 5. Initialize WebSocket Server ---
// Attaches the Socket.IO server to the same HTTP server instance.
initializeSocketIO(httpServer);


// --- 6. Global Error Handling Middleware ---
// This must be the VERY LAST middleware to be registered.
app.use(globalErrorHandler);


// --- 7. Start the Server ---
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server (HTTP + WebSockets) is running on port ${PORT}`);
});
