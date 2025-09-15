import  express, { Router }  from 'express';
import {
  handleCreateCanvas,
  handleGetCanvasById,
  handleUpdateCanvas,
} from '../controllers/canvasController.js';

const router:Router = express.Router();

/**
 * Defines the CRUD routes for canvases.
 * All routes in this module are protected by the `requireAuth` middleware,
 * which is applied in the main `index.ts` server file where these routes are mounted.
 */

// POST /api/canvases - Create a new canvas
router.post('/', handleCreateCanvas);

// GET /api/canvases/:canvasId - Get a specific canvas by its ID
router.get('/:canvasId', handleGetCanvasById);

// PUT /api/canvases/:canvasId - Update the content of a specific canvas
router.put('/:canvasId', handleUpdateCanvas);

export default router;
