import { Router } from 'express';
import { handleGenerateContent } from '../controllers/geminiController.js';

const router: Router = Router();

/**
 * Defines the route for the Gemini AI content generation feature.
 * When a POST request is made to this route, it will be handled by the
 * `handleGenerateContent` function from the geminiController.
 *
 * The full endpoint will be /api/ai/generate, as this router is mounted
 * under '/ai' in the main `routes/index.ts` file.
 */
router.post('/generate', handleGenerateContent);

export default router;
