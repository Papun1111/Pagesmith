import { Server, Socket } from 'socket.io';
import Canvas from '../../models/Canvas.js'; // Import the Canvas model to check permissions
import { logger } from '../../utils/logger.js';

// Interface to add our custom `userId` property to the socket data
interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

/**
 * Registers all event handlers related to canvas collaboration for a given socket connection.
 * @param io - The main Socket.IO server instance.
 * @param socket - The individual client socket connection.
 */
export const registerCanvasHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const { userId } = socket.data;

  if (!userId) {
    logger.warn('Unauthenticated socket tried to register canvas handlers. This should not happen.');
    return;
  }

  const joinCanvas = (canvasId: string) => {
    socket.join(canvasId);
    logger.info(`User ${userId} joined canvas room: ${canvasId}`);
    // Optional: Broadcast to the room that a new user has joined.
    // socket.to(canvasId).emit('user-joined', { userId });
  };


  const handleCanvasUpdate = async ({ canvasId, content }: { canvasId: string, content: string }) => {
    try {
      // Security Check: Verify the user has permission to write to this canvas.
      const canvas = await Canvas.findById(canvasId);
      if (!canvas) {
        socket.emit('error', { message: 'Canvas not found.' });
        return;
      }

      const hasWriteAccess =
        canvas.ownerId === userId ||
        canvas.collaborators.some(c => c.userId === userId && c.accessType === 'write');

      if (!hasWriteAccess) {
        socket.emit('error', { message: 'You do not have permission to edit this canvas.' });
        return;
      }


      socket.to(canvasId).emit('canvas-updated', content);
      

    } catch (error) {
      logger.error('Error handling canvas update:', error);
      socket.emit('error', { message: 'An error occurred while updating the canvas.' });
    }
  };

  /**
   * Handles broadcasting a user's cursor position to other clients in the room
   * for live presence indicators.
   */
  const handleCursorMove = ({ canvasId, cursorPosition }: { canvasId: string, cursorPosition: any }) => {
    // Broadcast cursor position to other clients in the room.
    socket.to(canvasId).emit('cursor-moved', { userId, position: cursorPosition });
  };

  // Register the event listeners for this socket.
  socket.on('join-canvas', joinCanvas);
  socket.on('canvas-update', handleCanvasUpdate);
  socket.on('cursor-move', handleCursorMove);
};
