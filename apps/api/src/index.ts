import 'dotenv/config'; 
import express from 'express';
import http from 'http';
import cors from 'cors';

// --- Configurations and Initializers ---
import { connectDB } from './config/index.js';
import { initializeSocketIO } from './socket/index.js';

// --- Middleware ---
import { clerkAuth } from './middleware/auth.js';
import { planBasedRateLimiter } from './middleware/rateLimiter.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

// --- Route Handlers ---
import apiRoutes from './routes/index.js';
import userRoutes from './routes/userRoutes.js';

// --- 1. Initial Server Setup ---
connectDB(); 
const app = express();
const httpServer = http.createServer(app);

// FIX: Use a more robust, function-based CORS configuration.
// This explicitly checks an allowlist and is more secure.
const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
        }
    },
    credentials: true 
}));

// --- 2. Webhook Route Configuration ---
app.use('/api/webhooks/clerk', express.raw({ type: 'application/json' }), userRoutes);

// --- 3. Global JSON Body Parser ---
app.use(express.json());

// --- 4. Authenticated API Routes ---
app.use('/api', clerkAuth, planBasedRateLimiter, apiRoutes);

// --- 5. Initialize WebSocket Server ---
initializeSocketIO(httpServer);

// --- 6. Global Error Handling Middleware ---
app.use(globalErrorHandler);

// --- 7. Start the Server ---
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server (HTTP + WebSockets) is running on port ${PORT}`);
});

