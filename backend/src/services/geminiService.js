/**
 * Google Gemini AI Integration Service
 * Powers automated product generation, SEO descriptions, voice transcript parsing, and tags.
 */

export async function generateProductDetails({ prompt, category = '', tone = 'persuasive and professional', brand = 'EMS' }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    console.warn('[AI WARNING] GEMINI_API_KEY not configured. Generating smart template response.');
    return generateLocalFallback(prompt, category, brand);
  }

  const systemInstruction = `You are an elite Shopify E-commerce Copywriter and Product Merchandising Expert for a top-tier retail brand.
Return your response ONLY as valid, raw JSON (no markdown formatting, no code block backticks) with this exact schema:
{
  "title": "Clean, high-converting product title (under 70 chars)",
  "seo_title": "SEO-friendly title for search engines with brand name (under 60 chars)",
  "seo_description": "Compelling meta description with call to action (140-155 chars)",
  "product_type": "Specific product type (e.g., Running Shoes, Desk Lamp)",
  "category": "Broad category",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "bullet_points": [
    "Key feature 1 with benefit",
    "Key feature 2 with benefit",
    "Key feature 3 with benefit",
    "Key feature 4 with benefit"
  ],
  "description_html": "<h3>Product Headline</h3><p>Engaging opening paragraph detailing lifestyle or problem solved.</p><h4>Key Features & Benefits</h4><ul><li>...</li></ul><h4>Specifications & Materials</h4><ul><li>...</li></ul><h4>Care & Longevity</h4><p>...</p>",
  "suggested_price": 49.99,
  "suggested_compare_at_price": 69.99,
  "suggested_variants": [
    { "option1": "Black", "option2": "Medium", "sku_suffix": "BLK-M", "price": 49.99 },
    { "option1": "Black", "option2": "Large", "sku_suffix": "BLK-L", "price": 49.99 },
    { "option1": "Navy", "option2": "Medium", "sku_suffix": "NVY-M", "price": 49.99 },
    { "option1": "Navy", "option2": "Large", "sku_suffix": "NVY-L", "price": 49.99 }
  ]
}`;

  const userPrompt = `Generate a complete Shopify product listing based on this input:
Product Idea / Notes: "${prompt}"
Category context: "${category || 'General'}"
Brand: "${brand}"
Desired Tone: "${tone}"`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemInstruction}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('No candidate content returned by Gemini API');
    }

    // Clean any markdown formatting if present
    const cleanedJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.error('[GEMINI SERVICE ERROR]', err.message);
    return generateLocalFallback(prompt, category, brand);
  }
}

/**
 * Parse an audio transcription / spoken voice memo into structured Shopify listing fields
 */
export async function parseVoiceTranscriptToProduct(transcript) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    return generateLocalFallback(transcript, 'Voice Memo', 'EMS');
  }

  const prompt = `A merchant spoke this audio voice note into their phone describing a new product to list on Shopify:
"""${transcript}"""

Extract and generate the product listing fields as raw JSON (no backticks) matching:
{
  "title": "Clean, optimized title",
  "seo_title": "SEO title",
  "seo_description": "Meta description",
  "product_type": "Type",
  "vendor": "Extracted vendor or EMS",
  "tags": ["tag1", "tag2", "tag3"],
  "price": 29.99,
  "compare_at_price": 39.99,
  "cost_per_item": 12.00,
  "description_html": "<p>...</p>",
  "options": [
    { "name": "Size", "values": ["Small", "Medium", "Large"] },
    { "name": "Color", "values": ["Black", "White"] }
  ],
  "variants": [
    { "option1": "Small", "option2": "Black", "price": 29.99, "inventory_quantity": 20 }
  ]
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json'
        }
      })
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
  } catch (err) {
    console.error('[GEMINI VOICE PARSE ERROR]', err.message);
    return generateLocalFallback(transcript, 'Voice Memo', 'EMS');
  }
}

/**
 * Smart template fallback generator when API key is pending or offline
 */
function generateLocalFallback(rawPrompt, category, brand) {
  const cleanTitle = rawPrompt
    .split('.')[0]
    .replace(/[^\w\s-]/g, '')
    .trim()
    .slice(0, 60) || 'Premium E-Commerce Product';

  return {
    title: `${cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)} - ${brand}`,
    seo_title: `${cleanTitle} | Official ${brand} Store`,
    seo_description: `Shop the new ${cleanTitle} by ${brand}. Engineered for premium durability, peak performance, and all-day comfort. Free shipping available.`,
    product_type: category || 'General Merchandise',
    category: category || 'Apparel & Goods',
    tags: ['premium', 'bestseller', 'new-arrival', 'trending', 'ems-exclusive'],
    bullet_points: [
      'Engineered with premium sustainable materials for maximum durability',
      'Ergonomic, modern design tailored for everyday versatility',
      'Backed by EMS 100% satisfaction guarantee and warranty',
      'Fast expedited shipping and 30-day hassle-free returns'
    ],
    description_html: `<h3>Elevate Your Everyday Standard</h3>
<p>Introducing the <strong>${cleanTitle}</strong> by ${brand}. Crafted with obsessive attention to detail, this product combines state-of-the-art craftsmanship with timeless aesthetics.</p>
<h4>Why You'll Love It:</h4>
<ul>
  <li><strong>Engineered Precision:</strong> Crafted using high-grade, resilient materials.</li>
  <li><strong>Versatile Performance:</strong> Designed to effortlessly adapt to your lifestyle.</li>
  <li><strong>Quality Assured:</strong> Inspected through rigorous multi-point quality standards.</li>
</ul>
<h4>Care & Usage:</h4>
<p>Wipe clean with a damp cloth or hand-wash as recommended. Store in a cool, dry place to maintain pristine finish.</p>`,
    suggested_price: 39.99,
    suggested_compare_at_price: 49.99,
    suggested_variants: [
      { option1: 'Standard', option2: 'Black', sku_suffix: 'STD-BLK', price: 39.99 },
      { option1: 'Standard', option2: 'White', sku_suffix: 'STD-WHT', price: 39.99 }
    ]
  };
}
