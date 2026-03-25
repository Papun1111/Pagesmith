import Canvas, { type ICanvas, AccessTypes } from '../models/Canvas.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

// Define the AccessType locally from the imported runtime object.
type AccessType = typeof AccessTypes[keyof typeof AccessTypes];

/* ------------------------------------------------------------------ */
/*  Plan-based limits                                                  */
/* ------------------------------------------------------------------ */

const PLAN_LIMITS = {
  free: {
    maxCanvases: 2,
    maxCollaboratorsPerCanvas: 1,
  },
  demon: {
    maxCanvases: Infinity,
    maxCollaboratorsPerCanvas: 5,
  },
  hashira: {
    maxCanvases: Infinity,
    maxCollaboratorsPerCanvas: Infinity,
  },
} as const;

type PlanKey = keyof typeof PLAN_LIMITS;

/**
 * Gets the user's plan from the database. Returns 'free' if not found.
 */
async function getUserPlan(clerkId: string): Promise<PlanKey> {
  const user = await User.findOne({ clerkId }).select('plan').lean();
  const plan = user?.plan || 'free';
  return plan as PlanKey;
}

/* ------------------------------------------------------------------ */
/*  Canvas CRUD                                                        */
/* ------------------------------------------------------------------ */

/**
 * Creates a new canvas for a given user.
 * Enforces plan-based canvas creation limits.
 */
export const createNewCanvas = async (ownerId: string, title?: string): Promise<ICanvas> => {
  if (!ownerId) {
    throw new ApiError(400, 'An owner ID is required to create a canvas.');
  }

  // --- Plan enforcement: check canvas count limit ---
  const userPlan = await getUserPlan(ownerId);
  const limits = PLAN_LIMITS[userPlan];
  
  if (limits.maxCanvases !== Infinity) {
    const currentCount = await Canvas.countDocuments({ ownerId });
    if (currentCount >= limits.maxCanvases) {
      throw new ApiError(
        403,
        `Your ${userPlan} plan allows a maximum of ${limits.maxCanvases} canvases. Please upgrade your plan to create more.`
      );
    }
  }

  try {
    const newCanvas = new Canvas({
      ownerId,
      title: title || 'Untitled Canvas',
    });
    await newCanvas.save();
    logger.info(`New canvas created with ID: ${newCanvas._id} by user: ${ownerId} (plan: ${userPlan})`);
    return newCanvas;
  } catch (error) {
    logger.error(`Error creating canvas for user ${ownerId}:`, error);
    throw new ApiError(500, 'Failed to create canvas due to a database error.');
  }
};

/**
 * Finds all canvases owned by or shared with a user.
 */
export const findCanvasesByOwner = async (userId: string): Promise<ICanvas[]> => {
    return Canvas.find({
        $or: [{ ownerId: userId }, { 'collaborators.userId': userId }],
    }).sort({ updatedAt: -1 });
};

/**
 * Finds a canvas by its ID and verifies if a user has permission to view it.
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
 * Updates the title of a canvas, checking for user permissions.
 */
export const updateCanvasTitle = async (canvasId: string, userId: string, title: string): Promise<ICanvas> => {
    const canvas = await findCanvasById(canvasId, userId);
    const hasWritePermission = canvas.ownerId === userId || canvas.collaborators.some(c => c.userId === userId && c.accessType === AccessTypes.WRITE);

    if (!hasWritePermission) {
        throw new ApiError(403, 'You do not have permission to edit this canvas title.');
    }
    canvas.title = title;
    await canvas.save();
    return canvas;
};

/**
 * Updates the content of a canvas, checking for user permissions.
 */
export const updateCanvasContent = async (canvasId: string, userId: string, content: string): Promise<ICanvas> => {
    const canvas = await findCanvasById(canvasId, userId);
    const hasWritePermission = canvas.ownerId === userId || canvas.collaborators.some(c => c.userId === userId && c.accessType === AccessTypes.WRITE);

    if (!hasWritePermission) {
        throw new ApiError(403, 'You do not have permission to edit this canvas content.');
    }
    canvas.content = content;
    await canvas.save();
    return canvas;
};

/**
 * Adds a collaborator to a canvas. Only the owner can do this.
 * Enforces plan-based collaborator limits.
 */
export const addCollaborator = async (canvasId: string, ownerId: string, collaboratorId: string, accessType: AccessType): Promise<ICanvas> => {
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) throw new ApiError(404, 'Canvas not found.');
    if (canvas.ownerId !== ownerId) throw new ApiError(403, 'Only the owner can add collaborators.');
    if (ownerId === collaboratorId) throw new ApiError(400, 'You cannot add yourself as a collaborator.');

    // Check if collaborator already exists (updating access doesn't count toward limit)
    const existingCollaborator = canvas.collaborators.find(c => c.userId === collaboratorId);

    if (!existingCollaborator) {
      // --- Plan enforcement: check collaborator count limit ---
      const userPlan = await getUserPlan(ownerId);
      const limits = PLAN_LIMITS[userPlan];

      if (limits.maxCollaboratorsPerCanvas !== Infinity) {
        const currentCollabCount = canvas.collaborators.length;
        if (currentCollabCount >= limits.maxCollaboratorsPerCanvas) {
          throw new ApiError(
            403,
            `Your ${userPlan} plan allows a maximum of ${limits.maxCollaboratorsPerCanvas} collaborator(s) per canvas. Please upgrade your plan to add more.`
          );
        }
      }

      canvas.collaborators.push({ userId: collaboratorId, accessType });
    } else {
      // If they exist, just update their access type
      existingCollaborator.accessType = accessType;
    }

    await canvas.save();
    return canvas;
};

/**
 * Removes a collaborator from a canvas. Only the owner can do this.
 */
export const removeCollaborator = async (canvasId: string, ownerId: string, collaboratorId: string): Promise<ICanvas> => {
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) throw new ApiError(404, 'Canvas not found.');
    if (canvas.ownerId !== ownerId) throw new ApiError(403, 'Only the owner can remove collaborators.');

    canvas.collaborators = canvas.collaborators.filter(c => c.userId !== collaboratorId);
    await canvas.save();
    return canvas;
};

export const deleteCanvas = async (canvasId: string, ownerId: string): Promise<void> => {
    const canvas = await Canvas.findById(canvasId);

    if (!canvas) {
        throw new ApiError(404, 'Canvas not found.');
    }

    if (canvas.ownerId !== ownerId) {
        throw new ApiError(403, 'You do not have permission to delete this canvas.');
    }

    await Canvas.findByIdAndDelete(canvasId);
    logger.info(`Canvas with ID: ${canvasId} was deleted by owner: ${ownerId}`);
};
