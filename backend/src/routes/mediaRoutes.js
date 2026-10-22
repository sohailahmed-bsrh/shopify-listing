import { Router } from 'express';
import multer from 'multer';
import { uploadFile, uploadVoiceNote, removeFile } from '../controllers/mediaController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

router.post('/upload', upload.single('file'), uploadFile);
router.post('/voice', upload.single('audio'), uploadVoiceNote);
router.delete('/delete', removeFile);

export default router;
