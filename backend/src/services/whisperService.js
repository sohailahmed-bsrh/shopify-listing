import fs from 'fs';
import path from 'path';

/**
 * Transcribe audio buffer or audio file using OpenAI Whisper API
 * @param {Buffer|string} audioInput - Audio buffer or filepath
 * @param {string} originalname - Original file name with extension
 * @returns {Promise<{ transcript: string, duration?: number }>}
 */
export async function transcribeAudio(audioInput, originalname = 'voice-note.webm') {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[WHISPER WARNING] OPENAI_API_KEY is not set. Using smart demo transcript for voice testing.');
    return {
      transcript: "This is our new Waterproof Hooded Performance Windbreaker in Matte Black and Deep Navy. Sizes available from Small up to Extra Large. Selling price is 79 dollars with compare at 110 dollars. Cost per item is 24 dollars. Made with high-density ripstop nylon, taped seams, and interior zip pocket. Include tags for activewear, outerwear, and waterproof.",
      isMock: true
    };
  }

  try {
    let fileBuffer;
    let fileName = originalname;

    if (Buffer.isBuffer(audioInput)) {
      fileBuffer = audioInput;
    } else if (typeof audioInput === 'string' && fs.existsSync(audioInput)) {
      fileBuffer = fs.readFileSync(audioInput);
      fileName = path.basename(audioInput);
    } else {
      throw new Error('Invalid audio input provided to Whisper service');
    }

    // Construct multipart form data for OpenAI API
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Create multipart payload manually or with Blob/FormData
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'audio/webm' });
    formData.append('file', blob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Whisper API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return {
      transcript: data.text || '',
      isMock: false
    };
  } catch (err) {
    console.error('[WHISPER ERROR]', err.message);
    throw err;
  }
}
