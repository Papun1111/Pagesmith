import { Server } from 'socket.io';
import { type AuthenticatedSocket } from '../index.js';
import { logger } from '../../utils/logger.js';
import * as CanvasService from '../../services/canvasService.js';

// This function now receives an `AuthenticatedSocket`, so we can be sure `socket.userId` exists.
export const registerCanvasHandlers = (io: Server, socket: AuthenticatedSocket) => {
  // FIX: The authentication check is now handled in `socket/index.ts`,
  // so we can remove the redundant check here, cleaning up the logic.
  const { userId } = socket;

  // Handler for when a client wants to join a specific canvas room.
  socket.on('join-canvas', (canvasId: string) => {
    socket.join(canvasId);
    logger.info(`User ${userId} joined canvas room: ${canvasId}`);
  });

  // Handler for when a client sends an update for a canvas's content.
  socket.on('canvas-update', async ({ canvasId, content }: { canvasId: string, content: string }) => {
    try {
      // Before broadcasting, verify the user has write permission.
      await CanvasService.updateCanvasContent(canvasId, userId, content);
      
      // Broadcast the update to all other clients in the same room.
      socket.to(canvasId).emit('canvas-updated', content);
    } catch (error: any) {
      logger.error(`User ${userId} failed to update canvas ${canvasId}:`, error.message);
      // Optionally, emit an error back to the originating client.
      socket.emit('update-error', { canvasId, message: error.message });
    }
  });

  // Handler for broadcasting cursor positions.
  socket.on('cursor-move', ({ canvasId, cursorPosition }: { canvasId: string, cursorPosition: any }) => {
    socket.to(canvasId).emit('cursor-moved', { userId, position: cursorPosition });
  });
};
