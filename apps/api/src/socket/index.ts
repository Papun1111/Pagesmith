import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '@clerk/backend';
import { registerCanvasHandlers } from './handlers/canvasHandlers.js';
import { logger } from '../utils/logger.js';

// Ensure the Clerk JWT key is provided.
if (!process.env.CLERK_JWT_KEY) {
  throw new Error("CLERK_JWT_KEY is not defined in the environment variables.");
}

// Extend the base Socket type to include our custom userId property.
export interface AuthenticatedSocket extends Socket {
  userId: string; // Make userId non-optional as it will always be present on authenticated sockets.
}

export const initializeSocketIO = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // --- WebSocket Authentication Middleware ---
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      logger.warn('Socket connection rejected: No token provided.');
      return next(new Error('Authentication error: No token.'));
    }

    try {
      const claims = await verifyToken(token, { jwtKey: process.env.CLERK_JWT_KEY??"" });
      
      // FIX: Add a defensive check to ensure the token payload contains a user ID (sub).
      if (!claims.sub) {
        logger.warn('Socket connection rejected: Token is missing user ID (sub).');
        return next(new Error('Authentication error: Invalid token payload.'));
      }
      
      // Attach the userId to the socket object for use in our event handlers.
      // We cast the socket to our extended type.
      (socket as AuthenticatedSocket).userId = claims.sub;
      next(); // Authentication successful, allow connection.
    } catch (error) {
      logger.error('Socket connection rejected: Invalid token.', error);
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  // --- Main Connection Handler ---
  io.on('connection', (socket: Socket) => {
    // Cast the generic socket to our authenticated type.
    const authSocket = socket as AuthenticatedSocket;

    // FIX: Centralize the authentication check here.
    // This ensures that no handlers are registered for a socket that somehow
    // bypassed the middleware or failed authentication.
    if (!authSocket.userId) {
      logger.error(`Connection event fired for an unauthenticated socket: ${authSocket.id}. Disconnecting.`);
      authSocket.disconnect(true);
      return;
    }

    logger.info(`User connected via WebSocket: ${authSocket.userId} (Socket ID: ${authSocket.id})`);

    // Delegate all canvas-related event handling to a separate module.
    registerCanvasHandlers(io, authSocket);

    // Handle disconnection.
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${authSocket.userId} (Socket ID: ${authSocket.id})`);
    });
  });

  logger.info('Socket.IO server initialized and attached to HTTP server.');
};
