import { Router } from 'express';
import { handleGenerateContent } from '../controllers/geminiController.js';

const router:Router = Router();

router.post('/generate', handleGenerateContent);

export default router;
