import { uploadMedia, deleteMedia } from '../services/s3Service.js';
import { transcribeAudio } from '../services/whisperService.js';
import { parseVoiceTranscriptToProduct } from '../services/geminiService.js';

export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    const folder = isVideo ? 'videos' : 'images';
    const uploadResult = await uploadMedia(req.file, folder);

    return res.json({
      success: true,
      url: uploadResult.url,
      storageKey: uploadResult.storageKey,
      isOci: uploadResult.isOci,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function uploadVoiceNote(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No voice audio file received' });
    }

    // 1. Upload audio file to S3 or local storage for audit/record
    const audioUpload = await uploadMedia(req.file, 'voice-notes');

    // 2. Transcribe with Whisper
    const transcription = await transcribeAudio(
      req.file.buffer || req.file.path,
      req.file.originalname || 'voice-memo.webm'
    );

    // 3. Parse transcript with Gemini into structured Shopify product fields
    const parsedProduct = await parseVoiceTranscriptToProduct(transcription.transcript);

    return res.json({
      success: true,
      audioUrl: audioUpload.url,
      transcript: transcription.transcript,
      isMockTranscript: transcription.isMock,
      parsedProduct
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function removeFile(req, res) {
  try {
    const { storageKey } = req.body;
    if (!storageKey) {
      return res.status(400).json({ success: false, error: 'Storage key required' });
    }

    await deleteMedia(storageKey);
    return res.json({ success: true, message: 'Media removed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
