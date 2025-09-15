import type {Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import * as CanvasService from '../services/canvasService.js';


/**
 * Creates a new canvas.
 */
export const handleCreateCanvas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    const { title } = req.body;
    const newCanvas = await CanvasService.createCanvas(userId!, title);
    res.status(201).json(newCanvas);
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a specific canvas by its ID.
 */
export const handleGetCanvasById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    const { canvasId } = req.params;
    const canvas = await CanvasService.findCanvasById(canvasId!, userId!);
    res.status(200).json(canvas);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates the content of a canvas.
 */
export const handleUpdateCanvas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    const { canvasId } = req.params;
    const { content } = req.body;
    const updatedCanvas = await CanvasService.updateCanvasContent(canvasId!, userId!, content);
    res.status(200).json(updatedCanvas);
  } catch (error) {
    next(error);
  }
};
