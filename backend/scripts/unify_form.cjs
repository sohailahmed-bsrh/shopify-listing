const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('ems_project/frontend/src/components/WhatsAppDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Find the desktop grid block
const startStr = '<div className="grid grid-cols-1 md:grid-cols-2 gap-10">';
const startIndex = content.indexOf(startStr);

if (startIndex === -1) {
  console.error('Could not find start of desktop grid');
  process.exit(1);
}

// Find the end before activeMobilePage === 'add-product-media'
const endStr = "{activeMobilePage === 'add-product-media' && (";
const endIndex = content.indexOf(endStr, startIndex);

if (endIndex === -1) {
  console.error('Could not find end marker');
  process.exit(1);
}

// Look backward from endIndex for the closing of the text page: ')}'
const blockToReplace = content.substring(startIndex, endIndex);

// The new unified card component
const newCard = `<div className="space-y-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <div>
                                                        <label className="block text-sm font-bold text-zinc-400 uppercase tracking-widest">Product Information</label>
                                                        <p className="text-xs text-zinc-500">Unified catalog details, pricing, taxonomy, and variants</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveMobilePage('add-product-voice')}
                                                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm transition-all"
                                                    >
                                                        <Mic size={14} />
                                                        <span>Autofill by Voice</span>
                                                    </button>
                                                </div>

                                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                                    {/* Row 1: Title & Brand */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/5">
                                                        <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-white/5 p-4">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Product Title</label>
                                                            <input
                                                                type="text"
                                                                value={formData.title}
                                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                                className="w-full bg-transparent text-base text-white outline-none placeholder-zinc-600 focus:text-emerald-400 transition-colors"
                                                                placeholder="e.g. Nike Air Max 90"
                                                            />
                                                        </div>
                                                        <div className="p-4">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Brand Name</label>
                                                            <input
                                                                type="text"
                                                                value={formData.brand}
                                                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                                                className="w-full bg-transparent text-base text-white outline-none placeholder-zinc-600 focus:text-emerald-400 transition-colors"
                                                                placeholder="e.g. Nike"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Price, Compare-at Price, Stock */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-white/5">
                                                        <div className="border-b sm:border-b-0 sm:border-r border-white/5 p-4">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Price (Rs)</label>
                                                            <input
                                                                type="number"
                                                                value={formData.starting_price}
                                                                onChange={e => setFormData({ ...formData, starting_price: e.target.value })}
                                                                className="w-full bg-transparent text-base text-emerald-400 font-semibold outline-none placeholder-zinc-600"
                                                                placeholder="6000"
                                                            />
                                                        </div>
                                                        <div className="border-b sm:border-b-0 sm:border-r border-white/5 p-4">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Min / Compare Price (Rs)</label>
                                                            <input
                                                                type="number"
                                                                value={formData.minimum_price}
                                                                onChange={e => setFormData({ ...formData, minimum_price: e.target.value })}
                                                                className="w-full bg-transparent text-base text-zinc-300 outline-none placeholder-zinc-600"
                                                                placeholder="5500"
                                                            />
                                                        </div>
                                                        <div className="p-4">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Stock Quantity</label>
                                                            <input
                                                                type="number"
                                                                value={formData.stock}
                                                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                                                className="w-full bg-transparent text-base text-white outline-none placeholder-zinc-600"
                                                                placeholder="25"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Row 3: Category & Demographic */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/5">
                                                        <div className="border-b md:border-b-0 md:border-r border-white/5 p-4">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Category / Type</label>
                                                            <select
                                                                value={(formData as any).category || 'Footwear / Shoes'}
                                                                onChange={e => setFormData({ ...formData, category: e.target.value } as any)}
                                                                className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
                                                            >
                                                                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#18181b]">{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="p-4">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Target Demographic</label>
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

                                                    {/* Row 4: Size & Color */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/5">
                                                        <div className="border-b md:border-b-0 md:border-r border-white/5 p-4 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Size (EU)</label>
                                                                {formData.size_original && SHOE_SIZE_CONVERSIONS[formData.size_original.trim()] && (
                                                                    <span className="text-emerald-400 font-mono text-xs">
                                                                        EU {formData.size_original} = US {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].us} | UK {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].uk} | {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].cm}cm
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={formData.size_original}
                                                                onChange={e => setFormData({ ...formData, size_original: e.target.value })}
                                                                className="w-full bg-transparent text-sm text-white outline-none"
                                                                placeholder="e.g. 42"
                                                            />
                                                            <div className="flex flex-wrap gap-1 pt-1">
                                                                {['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(sz => (
                                                                    <button
                                                                        key={sz}
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, size_original: sz })}
                                                                        className={\`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all \${
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

                                                        <div className="p-4 space-y-2">
                                                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Color & Swatches</label>
                                                            <input
                                                                type="text"
                                                                value={formData.color}
                                                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                                className="w-full bg-transparent text-sm text-white outline-none"
                                                                placeholder="e.g. Black"
                                                            />
                                                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                                {COLOR_SWATCHES.map(sw => (
                                                                    <button
                                                                        key={sw.name}
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, color: sw.name })}
                                                                        className={\`w-6 h-6 rounded-full border transition-all \${
                                                                            formData.color?.toLowerCase() === sw.name.toLowerCase()
                                                                                ? 'border-emerald-400 scale-115 shadow-md ring-2 ring-emerald-500/50'
                                                                                : 'border-white/20 hover:scale-105'
                                                                        }\`}
                                                                        style={{ backgroundColor: sw.hex }}
                                                                        title={sw.name}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Row 5: Description */}
                                                    <div className="p-4">
                                                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Description / Condition</label>
                                                        <textarea
                                                            value={formData.description}
                                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                            rows={3}
                                                            className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder-zinc-600 focus:bg-white/5 p-2 rounded-lg transition-colors"
                                                            placeholder="Product description, material, and condition details..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    `;

content = content.substring(0, startIndex) + newCard + content.substring(endIndex);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated desktop form to unified cohesive card!');
