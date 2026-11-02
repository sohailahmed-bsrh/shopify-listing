const fs = require('fs');

const filePath = 'ems_project/frontend/src/components/WhatsAppDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
const sep = isCRLF ? '\r\n' : '\n';

// 1. Mobile Form Update
// Target: Inside activeMobilePage === 'add-product-text', from `<div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6 custom-scrollbar">`
// to `<textarea value={formData.description} ... />\n                                </div>\n                            </div>\n                        </div>`

const mobileSearch = `<div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6 custom-scrollbar">`;
const mobileIdx = content.indexOf(mobileSearch);
if (mobileIdx === -1) {
    console.error('Could not find mobile form start');
    process.exit(1);
}

const mobileEndSearch = `<textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-transparent px-4 py-4 text-base text-white outline-none resize-none" placeholder="Description / Condition" />`;
const mobileEndIdx = content.indexOf(mobileEndSearch, mobileIdx);
if (mobileEndIdx === -1) {
    console.error('Could not find mobile form end');
    process.exit(1);
}
// Find the end of this textarea line
const mobileEndLineIdx = content.indexOf('\n', mobileEndIdx);

const mobileReplacement = `<div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6 custom-scrollbar">
                            {/* Voice-to-Field Autofill Banner (Mobile) */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-indigo-950/30 to-purple-950/40 border border-emerald-500/30 space-y-3 shadow-lg">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={\`w-9 h-9 rounded-xl flex items-center justify-center \${isVoiceAutofilling ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}\`}>
                                            <Mic size={18} className={isVoiceAutofilling ? 'animate-bounce' : ''} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white">Voice Autofill</h4>
                                            <span className="text-[10px] text-zinc-400">Urdu • English • Roman Urdu</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleToggleVoiceAutofill}
                                        className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md \${
                                            isVoiceAutofilling
                                                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                                : 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white'
                                        }\`}
                                    >
                                        {isVoiceAutofilling ? (
                                            <>
                                                <Square size={12} className="fill-current" />
                                                <span>Stop</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic size={12} />
                                                <span>Speak</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {voiceAutofillStatus && (
                                    <div className="px-3 py-2 rounded-xl bg-black/50 border border-white/5 text-[11px] text-zinc-300 flex items-center gap-2">
                                        <Loader2 size={12} className="animate-spin text-emerald-400 shrink-0" />
                                        <span>{voiceAutofillStatus}</span>
                                    </div>
                                )}

                                {extractedReview && (
                                    <div className="p-3 rounded-xl bg-black/70 border border-emerald-500/40 space-y-2 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Sparkles size={14} className="text-emerald-400" />
                                                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Review Speech Fields</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={applyExtractedFields}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-1"
                                                >
                                                    <CheckCircle size={12} />
                                                    <span>Apply</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setExtractedReview(null)}
                                                    className="px-2 py-1 rounded-lg bg-white/5 text-zinc-400 text-[11px]"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                            <div className="p-1.5 rounded-lg bg-white/5"><span className="text-zinc-500 block text-[9px] uppercase font-bold">Title</span><span className="text-white truncate block">{extractedReview.fields.title || '—'}</span></div>
                                            <div className="p-1.5 rounded-lg bg-white/5"><span className="text-zinc-500 block text-[9px] uppercase font-bold">Brand</span><span className="text-white truncate block">{extractedReview.fields.brand || '—'}</span></div>
                                            <div className="p-1.5 rounded-lg bg-white/5"><span className="text-zinc-500 block text-[9px] uppercase font-bold">Price</span><span className="text-emerald-400 font-bold block">{extractedReview.fields.starting_price ? \`Rs \${extractedReview.fields.starting_price}\` : '—'}</span></div>
                                            <div className="p-1.5 rounded-lg bg-white/5"><span className="text-zinc-500 block text-[9px] uppercase font-bold">Stock</span><span className="text-white block">{extractedReview.fields.stock ?? '—'}</span></div>
                                            <div className="p-1.5 rounded-lg bg-white/5"><span className="text-zinc-500 block text-[9px] uppercase font-bold">Gender</span><span className="text-white capitalize block">{extractedReview.fields.gender || '—'}</span></div>
                                            <div className="p-1.5 rounded-lg bg-white/5"><span className="text-zinc-500 block text-[9px] uppercase font-bold">Color</span><span className="text-white block">{extractedReview.fields.color || '—'}</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Basic Info</label>
                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5">
                                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none" placeholder="Product Title" />
                                    <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-4 py-4 text-base text-white outline-none" placeholder="Brand Name" />
                                    <div className="grid grid-cols-2 border-b border-white/5">
                                        <input type="number" value={formData.starting_price} onChange={e => setFormData({ ...formData, starting_price: e.target.value })} className="w-full bg-transparent border-r border-white/5 px-4 py-4 text-base text-white outline-none" placeholder="Price (Rs)" />
                                        <input type="number" value={formData.minimum_price} onChange={e => setFormData({ ...formData, minimum_price: e.target.value })} className="w-full bg-transparent px-4 py-4 text-base text-white outline-none" placeholder="Min Price (Rs)" />
                                    </div>
                                    <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full bg-transparent px-4 py-4 text-base text-white outline-none" placeholder="Stock Quantity (e.g. 25)" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Details & Taxonomy</label>
                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5">
                                    <div className="p-3 border-b border-white/5">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                                        <select
                                            value={(formData as any).category || 'Footwear / Shoes'}
                                            onChange={e => setFormData({ ...formData, category: e.target.value } as any)}
                                            className="w-full bg-transparent text-sm text-white outline-none appearance-none"
                                        >
                                            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#18181b]">{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="p-3 border-b border-white/5">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Target Gender</label>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {['men', 'women', 'unisex', 'kids'].map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, gender: g })}
                                                    className={\`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all \${
                                                        formData.gender?.toLowerCase() === g
                                                            ? 'bg-emerald-500 text-white shadow'
                                                            : 'bg-white/5 text-zinc-400 hover:text-white'
                                                    }\`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
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
                                    <div className="p-3 border-b border-white/5 space-y-2">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Color & Swatches</label>
                                        <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Color Name (e.g. Navy Blue)" />
                                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                            {COLOR_SWATCHES.map(sw => (
                                                <button
                                                    key={sw.name}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color: sw.name })}
                                                    className={\`w-5 h-5 rounded-full border transition-all \${
                                                        formData.color?.toLowerCase() === sw.name.toLowerCase()
                                                            ? 'border-emerald-400 scale-110 shadow-md ring-2 ring-emerald-500/40'
                                                            : 'border-white/20'
                                                    }\`}
                                                    style={{ backgroundColor: sw.hex }}
                                                    title={sw.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-transparent px-4 py-4 text-base text-white outline-none resize-none" placeholder="Description / Condition" />`;

content = content.substring(0, mobileIdx) + mobileReplacement + content.substring(mobileEndLineIdx + 1);

// 2. Desktop Form Update
// Target: Inside `activeMobilePage.startsWith('add-product')` -> `Text Details Tab`:
// `(activeMobilePage === 'add-product' || activeMobilePage === 'add-product-text') && (`
// down to `<textarea\n                                                        value={formData.description}\n                                                        onChange={e => setFormData({ ...formData, description: e.target.value })}\n                                                        className="w-full flex-1 min-h-[120px] bg-transparent px-5 py-4 text-base text-white outline-none resize-none focus:bg-white/5 transition-colors"\n                                                        placeholder="Description / Condition"\n                                                    />\n                                                </div>\n                                            </div>\n                                        </div>`

const deskSearch = `{(activeMobilePage === 'add-product' || activeMobilePage === 'add-product-text') && (`;
const deskIdx = content.indexOf(deskSearch);
if (deskIdx === -1) {
    console.error('Could not find desktop form start');
    process.exit(1);
}

const deskEndSearch = `placeholder="Description / Condition"`;
const deskEndIdx = content.indexOf(deskEndSearch, deskIdx);
if (deskEndIdx === -1) {
    console.error('Could not find desktop form end');
    process.exit(1);
}
// Find the `/>` after placeholder
const deskEndTag = content.indexOf('/>', deskEndIdx);
const deskEndLineIdx = content.indexOf('\n', deskEndTag);

const deskReplacement = `{(activeMobilePage === 'add-product' || activeMobilePage === 'add-product-text') && (
                                        <div className="space-y-6">
                                            {/* AI Voice-to-Field Autofill Header Banner (Desktop) */}
                                            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-indigo-950/30 to-purple-950/40 border border-emerald-500/30 backdrop-blur-sm space-y-4 shadow-2xl">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center \${isVoiceAutofilling ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}\`}>
                                                            <Mic size={24} className={isVoiceAutofilling ? 'animate-bounce' : ''} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-base font-bold text-white tracking-tight">AI Voice-to-Field Autofill</h4>
                                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                    Urdu • English • Roman Urdu
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-zinc-400 mt-1">
                                                                Speak product title, brand, category, color, size, price, and stock in any language. Whisper AI parses it instantly.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={handleToggleVoiceAutofill}
                                                        className={\`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all active:scale-95 shadow-xl \${
                                                            isVoiceAutofilling
                                                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
                                                                : 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-600/30'
                                                        }\`}
                                                    >
                                                        {isVoiceAutofilling ? (
                                                            <>
                                                                <Square size={16} className="fill-current" />
                                                                <span>Stop Recording</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Mic size={16} />
                                                                <span>🎙️ Speak to Auto-Fill</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {voiceAutofillStatus && (
                                                    <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 flex items-center gap-2">
                                                        <Loader2 size={14} className="animate-spin text-emerald-400 shrink-0" />
                                                        <span>{voiceAutofillStatus}</span>
                                                    </div>
                                                )}

                                                {/* Extracted Fields Review Banner */}
                                                {extractedReview && (
                                                    <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-3 animate-in fade-in duration-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Sparkles size={16} className="text-emerald-400" />
                                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Review Speech Fields Before Applying</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={applyExtractedFields}
                                                                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                                                                >
                                                                    <CheckCircle size={14} />
                                                                    <span>Apply to Form</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setExtractedReview(null)}
                                                                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
                                                                >
                                                                    Dismiss
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {extractedReview.text && (
                                                            <p className="text-xs italic text-zinc-400 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                                                &ldquo;{extractedReview.text}&rdquo;
                                                            </p>
                                                        )}

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Title</span>
                                                                <span className="text-zinc-100 font-semibold truncate block">{extractedReview.fields.title || '—'}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Brand</span>
                                                                <span className="text-zinc-100 font-semibold truncate block">{extractedReview.fields.brand || '—'}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Price</span>
                                                                <span className="text-emerald-400 font-bold block">{extractedReview.fields.starting_price ? \`Rs \${extractedReview.fields.starting_price}\` : '—'}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Stock</span>
                                                                <span className="text-zinc-100 font-semibold block">{extractedReview.fields.stock ?? '—'}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Category</span>
                                                                <span className="text-zinc-100 font-semibold truncate block">{extractedReview.fields.category || '—'}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Gender</span>
                                                                <span className="text-zinc-100 font-semibold capitalize block">{extractedReview.fields.gender || '—'}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Color</span>
                                                                <span className="text-zinc-100 font-semibold truncate block">{extractedReview.fields.color || '—'}</span>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Size</span>
                                                                <span className="text-zinc-100 font-semibold block">{extractedReview.fields.size_original || extractedReview.fields.sizes?.[0] || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-4">
                                                    <label className="block text-sm font-bold text-zinc-500 uppercase tracking-widest pl-2">Basic Info</label>
                                                    <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5 shadow-xl h-full flex flex-col">
                                                        <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-6 py-5 text-lg text-white outline-none focus:bg-white/5 transition-colors" placeholder="Product Title" />
                                                        <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full bg-transparent border-b border-white/5 px-6 py-5 text-lg text-white outline-none focus:bg-white/5 transition-colors" placeholder="Brand Name" />
                                                        <div className="grid grid-cols-3 border-b border-white/5">
                                                            <input type="number" value={formData.starting_price} onChange={e => setFormData({ ...formData, starting_price: e.target.value })} className="w-full bg-transparent border-r border-white/5 px-5 py-5 text-base text-white outline-none focus:bg-white/5 transition-colors" placeholder="Price (Rs)" />
                                                            <input type="number" value={formData.minimum_price} onChange={e => setFormData({ ...formData, minimum_price: e.target.value })} className="w-full bg-transparent border-r border-white/5 px-5 py-5 text-base text-white outline-none focus:bg-white/5 transition-colors" placeholder="Min Price (Rs)" />
                                                            <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full bg-transparent px-5 py-5 text-base text-white outline-none focus:bg-white/5 transition-colors" placeholder="Stock Qty" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
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
                                                                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Gender</label>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    {['men', 'women', 'unisex', 'kids'].map(g => (
                                                                        <button
                                                                            key={g}
                                                                            type="button"
                                                                            onClick={() => setFormData({ ...formData, gender: g })}
                                                                            className={\`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all \${
                                                                                formData.gender?.toLowerCase() === g
                                                                                    ? 'bg-emerald-500 text-white shadow-md'
                                                                                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                                                                            }\`}
                                                                        >
                                                                            {g}
                                                                        </button>
                                                                    ))}
                                                                </div>
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
                                                                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Color & Swatches</label>
                                                                    <input
                                                                        type="text"
                                                                        value={formData.color}
                                                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                                        className="w-full bg-transparent text-base text-white outline-none mb-1.5"
                                                                        placeholder="e.g. Black"
                                                                    />
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        {COLOR_SWATCHES.map(sw => (
                                                                            <button
                                                                                key={sw.name}
                                                                                type="button"
                                                                                onClick={() => setFormData({ ...formData, color: sw.name })}
                                                                                className={\`w-5 h-5 rounded-full border transition-all \${
                                                                                    formData.color?.toLowerCase() === sw.name.toLowerCase()
                                                                                        ? 'border-emerald-400 scale-110 shadow-md ring-2 ring-emerald-500/40'
                                                                                        : 'border-white/20 hover:scale-105'
                                                                                }\`}
                                                                                style={{ backgroundColor: sw.hex }}
                                                                                title={sw.name}
                                                                            />
                                                                        ))}
                                                                    </div>
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
                                                        />`;

content = content.substring(0, deskIdx) + deskReplacement + content.substring(deskEndLineIdx + 1);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected Voice Autofill, Swatches, Gender Pills & Stock to both WhatsApp Add Product forms!');
