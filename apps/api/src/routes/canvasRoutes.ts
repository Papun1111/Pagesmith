import { Router } from 'express';
import * as CanvasController from '../controllers/canvasController.js';

const router:Router = Router();

// --- Routes for the collection of canvases ---

// GET /api/canvases - Fetches all canvases for the authenticated user.
router.get('/', CanvasController.handleGetCanvases);

// POST /api/canvases - Creates a new canvas.
router.post('/', CanvasController.handleCreateCanvas);


// --- Routes for a single, specific canvas ---

// GET /api/canvases/:canvasId - Fetches a single canvas by its ID.
router.get('/:canvasId', CanvasController.handleGetCanvasById);

// PATCH /api/canvases/:canvasId/title - Updates the title of a specific canvas.
router.patch('/:canvasId/title', CanvasController.handleUpdateCanvasTitle);

// PATCH /api/canvases/:canvasId/content - Updates the main content of a specific canvas.
router.patch('/:canvasId/content', CanvasController.handleUpdateCanvasContent);


// --- Routes for managing collaborators on a specific canvas ---

// POST /api/canvases/:canvasId/collaborators - Adds a new collaborator to a canvas.
router.post('/:canvasId/collaborators', CanvasController.handleAddCollaborator);

// DELETE /api/canvases/:canvasId/collaborators/:collaboratorId - Removes a collaborator.
router.delete('/:canvasId/collaborators/:collaboratorId', CanvasController.handleRemoveCollaborator);

export default router;

