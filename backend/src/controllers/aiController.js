import { generateProductDetails, parseVoiceTranscriptToProduct } from '../services/geminiService.js';

export async function generateProduct(req, res) {
  try {
    const { prompt, category, tone, brand } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Product prompt or concept is required' });
    }

    const data = await generateProductDetails({ prompt, category, tone, brand });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function parseVoice(req, res) {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ success: false, error: 'Transcript text is required' });
    }

    const data = await parseVoiceTranscriptToProduct(transcript);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
