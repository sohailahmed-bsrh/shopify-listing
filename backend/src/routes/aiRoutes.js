import { Router } from 'express';
import { generateProduct, parseVoice } from '../controllers/aiController.js';

const router = Router();

router.post('/generate', generateProduct);
router.post('/parse-voice', parseVoice);

export default router;
