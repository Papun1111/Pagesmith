import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '@clerk/backend';
import { registerCanvasHandlers } from './handlers/canvasHandlers.js';
import { logger } from '../utils/logger.js';

// Ensure the Clerk JWT key is provided for networkless verification.
if (!process.env.CLERK_JWT_KEY) {
  throw new Error("CLERK_JWT_KEY is not defined in the environment variables. Please add it from your Clerk Dashboard.");
}

// Extend the base Socket type to include our custom userId property.
interface AuthenticatedSocket extends Socket {
  userId?: string;
}


export const initializeSocketIO = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
   
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn('Socket connection rejected: No token provided.');
      return next(new Error('Authentication error: No token.'));
    }

    try {
      // Use the standalone verifyToken function with the JWT public key for fast, networkless verification.
      const claims = await verifyToken(token, {
        jwtKey: process.env.CLERK_JWT_KEY??"",
      });

      socket.userId = claims.sub;
      next(); // Authentication successful, allow connection.
    } catch (error) {
      logger.error('Socket connection rejected: Invalid token.', error);
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  
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

