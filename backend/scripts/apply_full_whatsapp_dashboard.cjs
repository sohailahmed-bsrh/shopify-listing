const fs = require('fs');
const file = 'c:/Users/BILAL.COM/Desktop/shopify_listing/ems_project/frontend/src/components/WhatsAppDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports at the top
const importAnchor = "import { api } from '../services/api';";
const newImports = `import { api } from '../services/api';
import { ShopifyProductsView } from './ShopifyProductsView';
import { ShopifyOrdersView } from './ShopifyOrdersView';
import { ShopifyProductModal } from './ShopifyProductModal';
import type { ShopifyRealProduct } from '../types';`;

if (!content.includes('ShopifyProductsView')) {
    content = content.replace(importAnchor, newImports);
}

// 2. Add Store to lucide-react icons if not present
if (!content.includes('Store,')) {
    content = content.replace('X, LogOut, Loader2, Sparkles, AlertCircle', 'X, LogOut, Loader2, Sparkles, AlertCircle, Store');
}

// 3. Add shopify_product_id to Product interface
if (!content.includes('shopify_product_id?:')) {
    content = content.replace("created_at: string;\n}", "created_at: string;\n    shopify_product_id?: string | null;\n}");
}

// 4. Add channel & Shopify state inside WhatsAppDashboard component
const stateAnchor = "const WhatsAppDashboard = ({ onLogout }: { onLogout?: () => void }) => {";
const channelState = `const WhatsAppDashboard = ({ onLogout }: { onLogout?: () => void }) => {

    // Channel and Store Navigation
    const [productChannel, setProductChannel] = useState<'whatsapp' | 'shopify'>('whatsapp');
    const [shopifySubTab, setShopifySubTab] = useState<'products' | 'orders'>('products');
    const [selectedShopifyProduct, setSelectedShopifyProduct] = useState<ShopifyRealProduct | null>(null);
    const [whatsAppProductForShopify, setWhatsAppProductForShopify] = useState<any | null>(null);
    const [showShopifyModal, setShowShopifyModal] = useState(false);
    const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'sold'>('all');`;

if (!content.includes("const [productChannel, setProductChannel]")) {
    content = content.replace(stateAnchor, channelState);
}

// 5. Add constants: SHOE_SIZE_CONVERSIONS, PRODUCT_CATEGORIES
const constantsAnchor = "const COLOR_PRESETS = [";
const newConstantsPrefix = `const SHOE_SIZE_CONVERSIONS: Record<string, string> = {
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
const ALL_SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
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
];
`;

if (!content.includes('SHOE_SIZE_CONVERSIONS')) {
    content = content.replace(constantsAnchor, newConstantsPrefix + constantsAnchor);
}

// 6. Update handleTranscribe to autofill formData
const oldTranscribeBlock = `            if (data.success) {
                setTranscriptionText(data.text);
            } else {
                throw new Error(data.error || 'Failed to transcribe');
            }`;

const newTranscribeBlock = `            if (data.success) {
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

if (content.includes(oldTranscribeBlock)) {
    content = content.replace(oldTranscribeBlock, newTranscribeBlock);
}

// 7. Add List on Shopify button on product card
const cardDeleteBtn = `<button 
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                                                        className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center transition-colors border border-red-500/10"
                                                                        title="Delete Product"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>`;

const cardShopifyAndActionBtns = `<button 
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setWhatsAppProductForShopify(product);
                                                                            setSelectedShopifyProduct(null);
                                                                            setShowShopifyModal(true);
                                                                        }}
                                                                        className={\`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border \${
                                                                            product.shopify_product_id
                                                                                ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/20'
                                                                                : 'bg-white/5 hover:bg-purple-500/20 text-zinc-300 hover:text-purple-300 border-white/5'
                                                                        }\`}
                                                                        title={product.shopify_product_id ? 'View/Update on Shopify Store' : 'List on Shopify Store'}
                                                                    >
                                                                        <Store size={14} className={product.shopify_product_id ? 'text-purple-400' : ''} />
                                                                        <span className="hidden sm:inline">
                                                                            {product.shopify_product_id ? 'On Shopify' : 'List on Shopify'}
                                                                        </span>
                                                                    </button>
                                                                    ${cardDeleteBtn}`;

if (content.includes(cardDeleteBtn) && !content.includes('setWhatsAppProductForShopify(product)')) {
    content = content.replace(cardDeleteBtn, cardShopifyAndActionBtns);
}

// 8. Add List on Shopify in Product Details drawer
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

if (content.includes(detailsEditBtn) && !content.includes('View / Update on Shopify Store')) {
    content = content.replace(detailsEditBtn, detailsWithShopifyBtn);
}

// 9. Add ShopifyProductModal near the end of WhatsAppDashboard
const modalAnchor = "{/* Global Media Preview */}";
const shopifyModalMarkup = `{/* Real Shopify Product Modal */}
            <ShopifyProductModal
                isOpen={showShopifyModal}
                onClose={() => {
                    setShowShopifyModal(false);
                    setSelectedShopifyProduct(null);
                    setWhatsAppProductForShopify(null);
                }}
                shopifyProduct={selectedShopifyProduct}
                whatsAppProduct={whatsAppProductForShopify}
                onSuccess={() => {
                    fetchProducts();
                }}
            />

            ${modalAnchor}`;

if (!content.includes('<ShopifyProductModal')) {
    content = content.replace(modalAnchor, shopifyModalMarkup);
}

fs.writeFileSync(file, content, 'utf8');
console.log('SUCCESS: Applied all baseline integrations to WhatsAppDashboard.tsx');
