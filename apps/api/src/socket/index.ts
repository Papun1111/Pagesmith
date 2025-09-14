import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClerkClient } from '@clerk/backend';
import { registerCanvasHandlers } from './handlers/canvasHandlers.js';
import { logger } from '../utils/logger.js';

// Ensure the Clerk secret key is provided, otherwise the application cannot function.
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is not defined in the environment variables.");
}

// Initialize the Clerk client using your secret key from environment variables.
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Extend the base Socket type to include our custom userId property.
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * Initializes the Socket.IO server, attaching it to the provided HTTP server.
 * It sets up a crucial authentication middleware for all incoming WebSocket connections.
 * @param httpServer The Node.js HTTP server instance to attach Socket.IO to.
 */
export const initializeSocketIO = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // --- WebSocket Authentication Middleware ---
  // This middleware runs for every new connecting client.
  io.use(async (socket: AuthenticatedSocket, next) => {
    // The client must send their session token in the 'auth' object during connection.
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn('Socket connection rejected: No token provided.');
      return next(new Error('Authentication error: No token.'));
    }

    try {
      // FIX: Use the 'tokens' namespace to access the verifyToken method.
      const claims = await clerkClient.clients.verifyClient(token);
      // The 'sub' (subject) claim in the JWT corresponds to the Clerk User ID.
      // We attach the userId to the socket object for use in our event handlers.
      socket.userId = claims.id;
      next(); // Authentication successful, allow connection.
    } catch (error) {
      logger.error('Socket connection rejected: Invalid token.', error);
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  // --- Main Connection Handler ---
  // This logic runs after a client has been successfully authenticated.
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected via WebSocket: ${socket.userId} (Socket ID: ${socket.id})`);

    // Delegate all canvas-related event handling to a separate module for organization.
    registerCanvasHandlers(io, socket);

    // Handle disconnection.
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId} (Socket ID: ${socket.id})`);
    });
  });

  logger.info('Socket.IO server initialized and attached to HTTP server.');
};

