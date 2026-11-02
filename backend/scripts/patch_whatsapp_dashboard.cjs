const fs = require('fs');
const file = 'c:/Users/BILAL.COM/Desktop/shopify_listing/ems_project/frontend/src/components/WhatsAppDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add categories and shoe size conversion constants
const targetAfterSizes = "const ALL_SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];";
const newConstants = `const ALL_SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
const SHOE_SIZE_CONVERSIONS: Record<string, string> = {
    '38': 'EU 38 | US 5.5 | UK 5',
    '39': 'EU 39 | US 6.5 | UK 6',
    '40': 'EU 40 | US 7.0 | UK 6.5',
    '41': 'EU 41 | US 8.0 | UK 7.5',
    '42': 'EU 42 | US 8.5 | UK 8.0',
    '43': 'EU 43 | US 9.5 | UK 9.0',
    '44': 'EU 44 | US 10.0 | UK 9.5',
    '45': 'EU 45 | US 11.0 | UK 10.5',
    '46': 'EU 46 | US 12.0 | UK 11.5',
    '47': 'EU 47 | US 13.0 | UK 12.5'
};
const PRODUCT_CATEGORIES = [
    'Footwear > Sneakers',
    'Footwear > Running Shoes',
    'Footwear > Casual Shoes',
    'Footwear > Formal Shoes',
    'Footwear > Boots',
    'Footwear > Sandals & Slides',
    'Apparel > T-Shirts & Tops',
    'Apparel > Hoodies & Jackets',
    'Apparel > Pants & Jeans',
    'Accessories > Bags & Watches'
];`;

if (content.includes(targetAfterSizes) && !content.includes("SHOE_SIZE_CONVERSIONS")) {
    content = content.replace(targetAfterSizes, newConstants);
}

// 2. Update handleTranscribe to parse fields into formData
const oldTranscribe = `            if (data.success) {
                setTranscriptionText(data.text);
            } else {
                throw new Error(data.error || 'Failed to transcribe');
            }`;

const newTranscribe = `            if (data.success) {
                setTranscriptionText(data.text);
                // Directly parse extracted speech and populate product form fields
                try {
                    const parseRes = await fetch('/api/transcribe/parse-product-fields', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: data.text })
                    });
                    const parseData = await parseRes.json();
                    if (parseData.success && parseData.fields) {
                        const f = parseData.fields;
                        setFormData(prev => ({
                            ...prev,
                            ...(f.brand ? { brand: f.brand } : {}),
                            ...(f.size_original ? { size_original: String(f.size_original) } : {}),
                            ...(f.color ? { color: f.color } : {}),
                            ...(f.starting_price ? { starting_price: String(f.starting_price) } : {}),
                            ...(f.minimum_price ? { minimum_price: String(f.minimum_price) } : {}),
                            ...(f.gender ? { gender: f.gender.toLowerCase() } : {}),
                            ...(f.title ? { title: f.title } : {}),
                            ...(f.description ? { description: f.description } : {})
                        }));
                        const items = [
                            f.brand ? \`Brand: \${f.brand}\` : '',
                            f.size_original ? \`Size: \${f.size_original}\` : '',
                            f.color ? \`Color: \${f.color}\` : '',
                            f.starting_price ? \`Price: Rs \${f.starting_price}\` : ''
                        ].filter(Boolean).join(' | ');
                        setSpeechStatusText(\`✅ Voice Transcription Auto-Filled: \${items}\`);
                        setTimeout(() => setSpeechStatusText(null), 7000);
                    }
                } catch (pe) {
                    console.warn('Transcript parse notice:', pe);
                }
            } else {
                throw new Error(data.error || 'Failed to transcribe');
            }`;

if (content.includes(oldTranscribe)) {
    content = content.replace(oldTranscribe, newTranscribe);
}

// 3. Add List on Shopify in Product Details drawer (row 7 actions)
const detailsEditBtn = `<button
                                    type="button"
                                    onClick={() => handleEditFromDetails(viewingProduct)}
                                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Edit3 size={18} /> Edit Product Details
                                </button>`;

const detailsWithShopifyBtn = `<button
                                    type="button"
                                    onClick={() => {
                                        handleCloseDetails();
                                        setWhatsAppProductForShopify(viewingProduct);
                                        setSelectedShopifyProduct(null);
                                        setShowShopifyModal(true);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer mb-2"
                                >
                                    <Store size={18} /> {viewingProduct.shopify_product_id ? 'View / Update on Shopify Store' : 'List on Shopify Store'}
                                </button>
                                ${detailsEditBtn}`;

if (content.includes(detailsEditBtn) && !content.includes("List on Shopify Store")) {
    content = content.replace(detailsEditBtn, detailsWithShopifyBtn);
}

fs.writeFileSync(file, content, 'utf8');
console.log('SUCCESS: Patched constants, transcription autofill & details action in WhatsAppDashboard.tsx');
