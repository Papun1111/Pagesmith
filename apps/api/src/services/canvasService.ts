import Canvas, { type ICanvas } from '../models/Canvas.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import User from '../models/User.js';

/**
 * Creates a new canvas for a given user.
 * @param ownerId - The Clerk ID of the user creating the canvas.
 * @param title - The initial title for the canvas.
 * @returns The newly created canvas document.
 */
export const createCanvas = async (ownerId: string, title?: string): Promise<ICanvas> => {
  if (!ownerId) {
    throw new ApiError(400, 'An owner ID is required to create a canvas.');
  }

  try {
    const newCanvas = new Canvas({
      ownerId,
      title: title || 'Untitled Canvas',
      content: '# Start your masterpiece...', 
      collaborators: [],
    });

    await newCanvas.save();
    logger.info(`New canvas created with ID: ${newCanvas._id} by user: ${ownerId}`);
    return newCanvas;
  } catch (error) {
    logger.error(`Error creating canvas for user ${ownerId}:`, error);
    throw new ApiError(500, 'Failed to create canvas due to a database error.');
  }
};

/**
 * Finds a canvas by its ID and verifies if a user has permission to view it.
 * @param canvasId - The ID of the canvas.
 * @param userId - The Clerk ID of the user requesting access.
 * @returns The canvas document if found and user has access.
 * @throws ApiError if canvas is not found or user lacks permission.
 */
export const findCanvasById = async (canvasId: string, userId: string): Promise<ICanvas> => {
  const canvas = await Canvas.findById(canvasId);

  if (!canvas) {
    throw new ApiError(404, 'Canvas not found.');
  }

  const isOwner = canvas.ownerId === userId;
  const isCollaborator = canvas.collaborators.some(c => c.userId === userId);

  if (!isOwner && !isCollaborator) {
    throw new ApiError(403, 'You do not have permission to access this canvas.');
  }

  return canvas;
};

/**
 * Updates the content of a canvas.
 * @param canvasId - The ID of the canvas to update.
 * @param userId - The Clerk ID of the user making the update.
 * @param content - The new markdown content.
 * @returns The updated canvas document.
 * @throws ApiError if the user does not have write permission.
 */
export const updateCanvasContent = async (canvasId: string, userId: string, content: string): Promise<ICanvas> => {
    const canvas = await findCanvasById(canvasId, userId); // Permission check is built-in

    const isOwner = canvas.ownerId === userId;
    // FIX: Aligned permission check with the new Canvas model.
    // The 'collab' accessType has been removed, so we only check for 'write'.
    const canWrite = canvas.collaborators.some(
        c => c.userId === userId && c.accessType === 'write'
    );

    if (!isOwner && !canWrite) {
        throw new ApiError(403, 'You do not have permission to edit this canvas.');
    }

    canvas.content = content;
    await canvas.save();
    return canvas;
};

