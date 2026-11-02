const fs = require('fs');

const targetFile = 'c:/Users/BILAL.COM/Desktop/Ecomerce-Management-System/frontend/src/components/WhatsAppDashboard.tsx';
let raw = fs.readFileSync(targetFile, 'utf8');
const isCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

// 1. Check if already updated
if (content.includes('ShopifyProductsView') && content.includes('PRODUCT_CATEGORIES')) {
    console.log('Already updated.');
    process.exit(0);
}

// 2. Add imports
const oldImport = "import CustomAudioPlayer from './CustomAudioPlayer';\nimport React, { useState, useEffect, useRef } from 'react';\nimport { Package, ShieldAlert";
const newImport = `import CustomAudioPlayer from './CustomAudioPlayer';
import ShopifyProductsView from './ShopifyProductsView';
import ShopifyOrdersView from './ShopifyOrdersView';
import ShopifyProductModal from './ShopifyProductModal';
import type { ShopifyRealProduct } from '../types';
import React, { useState, useEffect, useRef } from 'react';
import { Package, ShieldAlert, Store`;

if (!content.includes(oldImport)) {
    console.error('Failed to locate oldImport');
    process.exit(1);
}
content = content.replace(oldImport, newImport);

// 3. Add constants before Product interface
const oldInterface = `interface Product {
    id: number;
    title: string;
    brand: string | null;
    gender: string;`;

const newInterface = `const SHOE_SIZE_CONVERSIONS: Record<string, { us: string; uk: string; cm: string }> = {
    '38': { us: '5.5', uk: '5', cm: '24' },
    '39': { us: '6.5', uk: '6', cm: '24.5' },
    '40': { us: '7', uk: '6.5', cm: '25' },
    '41': { us: '8', uk: '7.5', cm: '26' },
    '42': { us: '8.5', uk: '8', cm: '26.5' },
    '43': { us: '9.5', uk: '9', cm: '27.5' },
    '44': { us: '10', uk: '9.5', cm: '28' },
    '45': { us: '11', uk: '10.5', cm: '29' },
    '46': { us: '12', uk: '11.5', cm: '30' },
};

const PRODUCT_CATEGORIES = [
    'Footwear / Shoes',
    'Clothing / Apparel',
    'Bags & Accessories',
    'Watches & Jewelry',
    'Electronics & Gadgets',
    'Beauty & Personal Care',
    'Home & Living',
    'Other'
];

interface Product {
    id: number;
    title: string;
    brand: string | null;
    gender: string;
    category?: string | null;`;

if (!content.includes(oldInterface)) {
    console.error('Failed to locate oldInterface');
    process.exit(1);
}
content = content.replace(oldInterface, newInterface);

// 4. In Product interface, add shopify_product_id
const oldProductEnd = `    voice_note_url: string | null;\n    created_at: string;\n}`;
const newProductEnd = `    voice_note_url: string | null;\n    shopify_product_id?: string | null;\n    created_at: string;\n}`;
if (!content.includes(oldProductEnd)) {
    console.error('Failed to locate oldProductEnd');
    process.exit(1);
}
content = content.replace(oldProductEnd, newProductEnd);

// 5. In formData initial state, add category
const oldFormData = `        brand: '',\n        gender: 'men',\n        color: '',`;
const newFormData = `        brand: '',\n        gender: 'men',\n        category: 'Footwear / Shoes',\n        color: '',`;
if (!content.includes(oldFormData)) {
    console.error('Failed to locate oldFormData');
    process.exit(1);
}
content = content.replace(oldFormData, newFormData);

// 6. In handleTranscribe, auto-extract fields from transcript
const oldTranscribeSuccess = `            if (data.success) {
                setTranscriptionText(data.text);
            } else {`;

const newTranscribeSuccess = `            if (data.success) {
                setTranscriptionText(data.text);
                if (data.text) {
                    fetch('/api/transcribe/parse-product-fields', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcript: data.text })
                    })
                    .then(res => res.json())
                    .then(parseData => {
                        if (parseData.success && parseData.fields) {
                            const f = parseData.fields;
                            setFormData(prev => ({
                                ...prev,
                                title: f.title || prev.title,
                                brand: f.brand || prev.brand,
                                color: f.color || prev.color,
                                size_original: f.size || prev.size_original,
                                starting_price: f.starting_price !== undefined ? String(f.starting_price) : prev.starting_price,
                                minimum_price: f.minimum_price !== undefined ? String(f.minimum_price) : prev.minimum_price,
                                description: f.description || prev.description || data.text,
                            }));
                        }
                    })
                    .catch(e => console.warn('Transcript auto-field extraction:', e));
                }
            } else {`;

if (!content.includes(oldTranscribeSuccess)) {
    console.error('Failed to locate oldTranscribeSuccess');
    process.exit(1);
}
content = content.replace(oldTranscribeSuccess, newTranscribeSuccess);

// 7. Update handleEdit to preserve category
const oldHandleEdit = `        setFormData({
            title: product.title,
            brand: product.brand || '',
            gender: product.gender,
            color: product.color || '',`;

const newHandleEdit = `        setFormData({
            title: product.title,
            brand: product.brand || '',
            gender: product.gender,
            category: (product as any).category || 'Footwear / Shoes',
            color: product.color || '',`;

if (!content.includes(oldHandleEdit)) {
    console.error('Failed to locate oldHandleEdit');
    process.exit(1);
}
content = content.replace(oldHandleEdit, newHandleEdit);

// 8. Update handleSubmit to append category
const oldHandleSubmit = `        fd.append('title', formData.title);
        fd.append('brand', formData.brand || '');
        fd.append('gender', formData.gender || 'unisex');`;

const newHandleSubmit = `        fd.append('title', formData.title);
        fd.append('brand', formData.brand || '');
        fd.append('gender', formData.gender || 'unisex');
        fd.append('category', (formData as any).category || 'Footwear / Shoes');`;

if (!content.includes(oldHandleSubmit)) {
    console.error('Failed to locate oldHandleSubmit');
    process.exit(1);
}
content = content.replace(oldHandleSubmit, newHandleSubmit);

// 9. Update products feed with vertical sub-navigation
const oldFeedHeader = `{subTab === 'products' && (
                                <div className="flex flex-col w-full h-full">
                                    {/* Desktop Toolbar (Hidden on Mobile) */}`;

const newFeedHeader = `{subTab === 'products' && (
                                <div className="flex flex-col md:flex-row gap-6 w-full h-full items-start">
                                    {/* Vertical Left Sub-Navigation */}
                                    <aside className="w-full md:w-64 shrink-0 bg-[#09090b] rounded-2xl border border-white/5 p-4 flex flex-col gap-3 shadow-xl">
                                        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/5">
                                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Channels</span>
                                            <span className="text-[10px] bg-white/5 text-zinc-400 px-2 py-0.5 rounded-full font-mono">2 Channels</span>
                                        </div>

                                        <div className="flex flex-row md:flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setProductChannel('whatsapp')}
                                                className={\`flex-1 md:flex-none flex items-center justify-between p-3 rounded-xl font-semibold text-sm transition-all text-left \${
                                                    productChannel === 'whatsapp'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                                        : 'bg-[#18181b]/60 text-zinc-400 hover:text-white hover:bg-[#18181b] border border-white/5'
                                                }\`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Package size={18} className={productChannel === 'whatsapp' ? 'text-emerald-400' : 'text-zinc-400'} />
                                                    <span>WhatsApp Products</span>
                                                </div>
                                                <span className={\`text-xs px-2 py-0.5 rounded-full font-bold \${
                                                    productChannel === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-zinc-500'
                                                }\`}>
                                                    {products.length}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setProductChannel('shopify')}
                                                className={\`flex-1 md:flex-none flex items-center justify-between p-3 rounded-xl font-semibold text-sm transition-all text-left \${
                                                    productChannel === 'shopify'
                                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                                                        : 'bg-[#18181b]/60 text-zinc-400 hover:text-white hover:bg-[#18181b] border border-white/5'
                                                }\`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Store size={18} className={productChannel === 'shopify' ? 'text-purple-400' : 'text-zinc-400'} />
                                                    <span>Shopify Listing</span>
                                                </div>
                                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                                                    Live
                                                </span>
                                            </button>
                                        </div>

                                        {productChannel === 'shopify' && (
                                            <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-2 animate-in fade-in duration-200">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Shopify Views</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShopifySubTab('products')}
                                                    className={\`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-all \${
                                                        shopifySubTab === 'products'
                                                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                                    }\`}
                                                >
                                                    <Tag size={15} />
                                                    <span>Products Catalog</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShopifySubTab('orders')}
                                                    className={\`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-all \${
                                                        shopifySubTab === 'orders'
                                                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                                    }\`}
                                                >
                                                    <ShoppingCart size={15} />
                                                    <span>Shopify Orders</span>
                                                </button>

                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedShopifyProduct(null);
                                                            setWhatsAppProductForShopify(null);
                                                            setShowShopifyModal(true);
                                                        }}
                                                        className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all active:scale-95 cursor-pointer"
                                                    >
                                                        <Plus size={15} />
                                                        <span>New Shopify Listing</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </aside>

                                    {/* Right Content Area */}
                                    <div className="flex-1 w-full min-w-0">
                                        {productChannel === 'shopify' ? (
                                            <div>
                                                {shopifySubTab === 'products' ? (
                                                    <ShopifyProductsView
                                                        onOpenAddModal={() => {
                                                            setSelectedShopifyProduct(null);
                                                            setWhatsAppProductForShopify(null);
                                                            setShowShopifyModal(true);
                                                        }}
                                                        onEditProduct={(p) => {
                                                            setSelectedShopifyProduct(p);
                                                            setWhatsAppProductForShopify(null);
                                                            setShowShopifyModal(true);
                                                        }}
                                                    />
                                                ) : (
                                                    <ShopifyOrdersView />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col w-full h-full">
                                                {/* Desktop Toolbar (Hidden on Mobile) */}`;

if (!content.includes(oldFeedHeader)) {
    console.error('Failed to locate oldFeedHeader');
    process.exit(1);
}
content = content.replace(oldFeedHeader, newFeedHeader);

// Close the inner WhatsApp div and the Right Content Area div:
const oldFeedEnd = `                                        })()
                                    )}
                                </div>
                                </div>
                            )}

                            {subTab === 'conversations'`;

const newFeedEnd = `                                        })()
                                    )}
                                </div>
                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {subTab === 'conversations'`;

if (!content.includes(oldFeedEnd)) {
    console.error('Failed to locate oldFeedEnd');
    process.exit(1);
}
content = content.replace(oldFeedEnd, newFeedEnd);

// 10. Add "List on Shopify" button to WhatsApp product cards
const oldCardButtons = `                                                                    <button 
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleEdit(product); setActiveMobilePage('add-product'); }}
                                                                        className="w-10 h-10 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl flex items-center justify-center transition-colors border border-white/5"
                                                                        title="Edit Product"
                                                                    >
                                                                        <Edit3 size={16} />
                                                                    </button>`;

const newCardButtons = `                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setWhatsAppProductForShopify(product);
                                                                            setSelectedShopifyProduct(null);
                                                                            setShowShopifyModal(true);
                                                                        }}
                                                                        className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 rounded-xl flex items-center gap-1.5 transition-colors border border-purple-500/20 text-xs font-semibold"
                                                                        title="List on Shopify"
                                                                    >
                                                                        <Store size={14} />
                                                                        <span className="hidden sm:inline">Shopify</span>
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleEdit(product); setActiveMobilePage('add-product'); }}
                                                                        className="w-10 h-10 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl flex items-center justify-center transition-colors border border-white/5"
                                                                        title="Edit Product"
                                                                    >
                                                                        <Edit3 size={16} />
                                                                    </button>`;

if (!content.includes(oldCardButtons)) {
    console.error('Failed to locate oldCardButtons');
    process.exit(1);
}
content = content.replace(oldCardButtons, newCardButtons);

// 11. Add "List on Shopify" button in product details drawer
const oldDrawerButtons = `                            {/* Row 7: Action Buttons */}
                            <div className="pt-2 space-y-2.5">
                                <button
                                    type="button"
                                    onClick={() => handleEditFromDetails(viewingProduct)}
                                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Edit3 size={18} /> Edit Product Details
                                </button>`;

const newDrawerButtons = `                            {/* Row 7: Action Buttons */}
                            <div className="pt-2 space-y-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWhatsAppProductForShopify(viewingProduct);
                                        setSelectedShopifyProduct(null);
                                        setShowShopifyModal(true);
                                    }}
                                    className="w-full py-3.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-sm flex items-center justify-center gap-2 border border-purple-500/30 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Store size={18} /> {viewingProduct?.shopify_product_id ? 'Update on Shopify' : 'List on Shopify'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleEditFromDetails(viewingProduct)}
                                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Edit3 size={18} /> Edit Product Details
                                </button>`;

if (!content.includes(oldDrawerButtons)) {
    console.error('Failed to locate oldDrawerButtons');
    process.exit(1);
}
content = content.replace(oldDrawerButtons, newDrawerButtons);

// 12. Update FAB button condition so it only shows on whatsapp product channel
const oldFAB = `{subTab === 'products' && (
                            <div className="fixed bottom-[85px] md:bottom-8 left-0 right-0 pointer-events-none z-40 flex justify-center px-4">`;

const newFAB = `{subTab === 'products' && productChannel === 'whatsapp' && (
                            <div className="fixed bottom-[85px] md:bottom-8 left-0 right-0 pointer-events-none z-40 flex justify-center px-4">`;

if (!content.includes(oldFAB)) {
    console.error('Failed to locate oldFAB');
    process.exit(1);
}
content = content.replace(oldFAB, newFAB);

// 13. Update Desktop Add/Edit Product Form with Category and Footwear Size Conversions
const oldDesktopDetails = `                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest pl-2">Details</label>
                                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5 shadow-xl h-full flex flex-col">
                                                    <div className="flex border-b border-white/5">
                                                        <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-1/3 bg-transparent border-r border-white/5 px-6 py-5 text-lg text-white outline-none appearance-none focus:bg-white/5 transition-colors cursor-pointer">
                                                            <option value="men" className="bg-[#18181b]">Men</option>
                                                            <option value="women" className="bg-[#18181b]">Women</option>
                                                            <option value="unisex" className="bg-[#18181b]">Unisex</option>
                                                            <option value="kids" className="bg-[#18181b]">Kids</option>
                                                        </select>
                                                        <input type="text" value={formData.size_original} onChange={e => setFormData({ ...formData, size_original: e.target.value })} className="w-1/3 bg-transparent border-r border-white/5 px-6 py-5 text-lg text-white outline-none focus:bg-white/5 transition-colors" placeholder="Size" />
                                                        <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-1/3 bg-transparent px-6 py-5 text-lg text-white outline-none focus:bg-white/5 transition-colors" placeholder="Color" />
                                                    </div>
                                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full flex-1 min-h-[140px] bg-transparent px-6 py-5 text-lg text-white outline-none resize-none focus:bg-white/5 transition-colors" placeholder="Description / Condition" />
                                                </div>
                                            </div>`;

const newDesktopDetails = `                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest pl-2">Details & Taxonomy</label>
                                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5 shadow-xl h-full flex flex-col">
                                                    <div className="flex border-b border-white/5">
                                                        <div className="w-1/2 border-r border-white/5 px-5 py-3">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                                                            <select
                                                                value={(formData as any).category || 'Footwear / Shoes'}
                                                                onChange={e => setFormData({ ...formData, category: e.target.value } as any)}
                                                                className="w-full bg-transparent text-base text-white outline-none appearance-none cursor-pointer"
                                                            >
                                                                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#18181b]">{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="w-1/2 px-5 py-3">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Gender</label>
                                                            <select
                                                                value={formData.gender}
                                                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                                                className="w-full bg-transparent text-base text-white outline-none appearance-none cursor-pointer"
                                                            >
                                                                <option value="men" className="bg-[#18181b]">Men</option>
                                                                <option value="women" className="bg-[#18181b]">Women</option>
                                                                <option value="unisex" className="bg-[#18181b]">Unisex</option>
                                                                <option value="kids" className="bg-[#18181b]">Kids</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col border-b border-white/5 px-5 py-3 gap-2">
                                                        <div className="flex gap-4">
                                                            <div className="w-1/2">
                                                                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Size (EU)</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.size_original}
                                                                    onChange={e => setFormData({ ...formData, size_original: e.target.value })}
                                                                    className="w-full bg-transparent text-base text-white outline-none"
                                                                    placeholder="e.g. 42"
                                                                />
                                                            </div>
                                                            <div className="w-1/2">
                                                                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Color</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.color}
                                                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                                    className="w-full bg-transparent text-base text-white outline-none"
                                                                    placeholder="e.g. Black"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Footwear Quick Sizes & Conversions */}
                                                        <div className="pt-1">
                                                            <div className="text-[11px] text-zinc-500 font-semibold mb-1 flex items-center justify-between">
                                                                <span>Quick Sizes (EU):</span>
                                                                {formData.size_original && SHOE_SIZE_CONVERSIONS[formData.size_original.trim()] && (
                                                                    <span className="text-emerald-400 font-mono text-xs">
                                                                        EU {formData.size_original} = US {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].us} | UK {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].uk} | {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].cm}cm
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(sz => (
                                                                    <button
                                                                        key={sz}
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, size_original: sz })}
                                                                        className={\`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all \${
                                                                            formData.size_original === sz
                                                                                ? 'bg-emerald-500 text-white shadow'
                                                                                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                                                                        }\`}
                                                                    >
                                                                        {sz}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <textarea
                                                        value={formData.description}
                                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                        className="w-full flex-1 min-h-[120px] bg-transparent px-5 py-4 text-base text-white outline-none resize-none focus:bg-white/5 transition-colors"
                                                        placeholder="Description / Condition"
                                                    />
                                                </div>
                                            </div>`;

if (!content.includes(oldDesktopDetails)) {
    console.error('Failed to locate oldDesktopDetails');
    process.exit(1);
}
content = content.replace(oldDesktopDetails, newDesktopDetails);

// 14. Update Mobile Add/Edit Product Details (add-product-text)
const oldMobileDetails = `                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Details</label>
                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5">
                                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none appearance-none">
                                        <option value="men">Men</option>
                                        <option value="women">Women</option>
                                        <option value="unisex">Unisex</option>
                                        <option value="kids">Kids</option>
                                    </select>
                                    <input type="text" value={formData.size_original} onChange={e => setFormData({ ...formData, size_original: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none" placeholder="Size" />
                                    <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none" placeholder="Color" />
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-transparent px-4 py-4 text-base text-white outline-none resize-none" placeholder="Description / Condition" />
                                </div>
                            </div>`;

const newMobileDetails = `                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Details & Taxonomy</label>
                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5">
                                    <select
                                        value={(formData as any).category || 'Footwear / Shoes'}
                                        onChange={e => setFormData({ ...formData, category: e.target.value } as any)}
                                        className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none appearance-none"
                                    >
                                        {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#18181b]">{c}</option>)}
                                    </select>
                                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none appearance-none">
                                        <option value="men">Men</option>
                                        <option value="women">Women</option>
                                        <option value="unisex">Unisex</option>
                                        <option value="kids">Kids</option>
                                    </select>
                                    <div className="border-b border-white/5 px-4 py-3">
                                        <input type="text" value={formData.size_original} onChange={e => setFormData({ ...formData, size_original: e.target.value })} className="w-full bg-transparent text-base text-white outline-none" placeholder="Size (EU)" />
                                        {formData.size_original && SHOE_SIZE_CONVERSIONS[formData.size_original.trim()] && (
                                            <div className="text-emerald-400 font-mono text-xs mt-1">
                                                EU {formData.size_original} = US {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].us} | UK {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].uk} | {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].cm}cm
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(sz => (
                                                <button
                                                    key={sz}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, size_original: sz })}
                                                    className={\`px-2 py-0.5 rounded-lg text-xs font-semibold \${
                                                        formData.size_original === sz ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400'
                                                    }\`}
                                                >
                                                    {sz}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none" placeholder="Color" />
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-transparent px-4 py-4 text-base text-white outline-none resize-none" placeholder="Description / Condition" />
                                </div>
                            </div>`;

if (!content.includes(oldMobileDetails)) {
    console.error('Failed to locate oldMobileDetails');
    process.exit(1);
}
content = content.replace(oldMobileDetails, newMobileDetails);

// Restore line endings if originally CRLF
if (isCRLF) {
    content = content.replace(/\n/g, '\r\n');
}

// Write updated content back
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated WhatsAppDashboard.tsx!');
