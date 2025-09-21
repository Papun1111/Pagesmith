import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import * as CanvasService from '../services/canvasService.js';
import { ApiError } from '../utils/apiError.js';
// FIX: Only import the runtime value 'AccessTypes', as the type alias is not exported.
import { AccessTypes } from '../models/Canvas.js';

// FIX: Define the AccessType locally from the imported runtime object.
// This resolves the import error because we no longer need to import the type directly.
type AccessType = typeof AccessTypes[keyof typeof AccessTypes];

export const handleGetCanvases = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) throw new ApiError(401, 'User not authenticated.');
        const canvases = await CanvasService.findCanvasesByOwner(userId);
        res.status(200).json(canvases);
    } catch (error) {
        next(error);
    }
};

export const handleGetCanvasById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) throw new ApiError(401, 'User not authenticated.');
        const { canvasId } = req.params;
        const canvas = await CanvasService.findCanvasById(canvasId??"", userId);
        res.status(200).json(canvas);
    } catch (error) {
        next(error);
    }
};

export const handleCreateCanvas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) throw new ApiError(401, 'User not authenticated.');
        const { title } = req.body;
        const newCanvas = await CanvasService.createNewCanvas(userId, title);
        res.status(201).json(newCanvas);
    } catch (error) {
        next(error);
    }
};

// --- NEW: Controller for updating the canvas title ---
export const handleUpdateCanvasTitle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) throw new ApiError(401, 'User not authenticated.');
        const { canvasId } = req.params;
        const { title } = req.body;
        if (typeof title !== 'string') {
            throw new ApiError(400, 'A valid title is required.');
        }
        // This assumes a `updateCanvasTitle` function exists in your service.
        const updatedCanvas = await CanvasService.updateCanvasTitle(canvasId??"", userId, title);
        res.status(200).json(updatedCanvas);
    } catch (error) {
        next(error);
    }
};

// --- NEW: Controller for updating the canvas content ---
export const handleUpdateCanvasContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) throw new ApiError(401, 'User not authenticated.');
        const { canvasId } = req.params;
        const { content } = req.body;
        if (typeof content !== 'string') {
            throw new ApiError(400, 'Valid content is required.');
        }
        const updatedCanvas = await CanvasService.updateCanvasContent(canvasId??"", userId, content);
        res.status(200).json(updatedCanvas);
    } catch (error) {
        next(error);
    }
};


export const handleAddCollaborator = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId: ownerId } = getAuth(req);
        if (!ownerId) throw new ApiError(401, 'User not authenticated.');
        const { canvasId } = req.params;
        const { collaboratorId, accessType } = req.body as { collaboratorId: string, accessType: AccessType };
        
        if (!collaboratorId || !accessType) {
            throw new ApiError(400, 'Collaborator ID and access type are required.');
        }

        if (!Object.values(AccessTypes).includes(accessType)) {
            throw new ApiError(400, `Invalid access type. Must be one of: ${Object.values(AccessTypes).join(', ')}`);
        }

        const updatedCanvas = await CanvasService.addCollaborator(canvasId??"", ownerId, collaboratorId, accessType);
        res.status(200).json(updatedCanvas);
    } catch (error) {
        next(error);
    }
};

export const handleRemoveCollaborator = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId: ownerId } = getAuth(req);
        if (!ownerId) throw new ApiError(401, 'User not authenticated.');
        const { canvasId, collaboratorId } = req.params;

        const updatedCanvas = await CanvasService.removeCollaborator(canvasId??"", ownerId, collaboratorId??"");
        res.status(200).json(updatedCanvas);
    } catch (error) {
        next(error);
    }
};

