const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('ems_project/frontend/src/components/WhatsAppDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const startMarker = '<div className="space-y-4">\n                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Basic Info</label>';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
  console.error('Could not find mobile form start');
  process.exit(1);
}

const endMarker = "{activeMobilePage === 'add-product-media' && (";
const endIndex = content.indexOf(endMarker, startIndex);

if (endIndex === -1) {
  console.error('Could not find mobile form end');
  process.exit(1);
}

// Find closing brackets before endMarker
const subBlock = content.substring(startIndex, endIndex);
const lastDivIndex = subBlock.lastIndexOf('</div>');

const newMobileCard = `<div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">Product Details</label>
                                    <button
                                        type="button"
                                        onClick={() => setActiveMobilePage('add-product-voice')}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
                                    >
                                        <Mic size={13} />
                                        <span>Autofill by Voice</span>
                                    </button>
                                </div>
                                <div className="bg-[#18181b] rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                                    {/* Title & Brand */}
                                    <div className="border-b border-white/5 p-3.5">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Product Title</label>
                                        <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-transparent text-base text-white outline-none placeholder-zinc-600" placeholder="Product Title" />
                                    </div>
                                    <div className="border-b border-white/5 p-3.5">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Brand Name</label>
                                        <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full bg-transparent text-base text-white outline-none placeholder-zinc-600" placeholder="Brand Name" />
                                    </div>

                                    {/* Pricing & Stock */}
                                    <div className="grid grid-cols-3 border-b border-white/5">
                                        <div className="border-r border-white/5 p-3">
                                            <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Price (Rs)</label>
                                            <input type="number" value={formData.starting_price} onChange={e => setFormData({ ...formData, starting_price: e.target.value })} className="w-full bg-transparent text-sm text-emerald-400 font-bold outline-none placeholder-zinc-600" placeholder="6000" />
                                        </div>
                                        <div className="border-r border-white/5 p-3">
                                            <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Min Price</label>
                                            <input type="number" value={formData.minimum_price} onChange={e => setFormData({ ...formData, minimum_price: e.target.value })} className="w-full bg-transparent text-sm text-zinc-300 outline-none placeholder-zinc-600" placeholder="5500" />
                                        </div>
                                        <div className="p-3">
                                            <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Stock</label>
                                            <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none placeholder-zinc-600" placeholder="25" />
                                        </div>
                                    </div>

                                    {/* Category & Gender */}
                                    <div className="p-3.5 border-b border-white/5">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                                        <select
                                            value={(formData as any).category || 'Footwear / Shoes'}
                                            onChange={e => setFormData({ ...formData, category: e.target.value } as any)}
                                            className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
                                        >
                                            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#18181b]">{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="p-3.5 border-b border-white/5">
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

                                    {/* Size (EU) */}
                                    <div className="p-3.5 border-b border-white/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Size (EU)</label>
                                            {formData.size_original && SHOE_SIZE_CONVERSIONS[formData.size_original.trim()] && (
                                                <div className="text-emerald-400 font-mono text-[11px]">
                                                    EU {formData.size_original} = US {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].us} | UK {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].uk} | {SHOE_SIZE_CONVERSIONS[formData.size_original.trim()].cm}cm
                                                </div>
                                            )}
                                        </div>
                                        <input type="text" value={formData.size_original} onChange={e => setFormData({ ...formData, size_original: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none placeholder-zinc-600" placeholder="e.g. 42" />
                                        <div className="flex flex-wrap gap-1 pt-1">
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

                                    {/* Color & Swatches */}
                                    <div className="p-3.5 border-b border-white/5 space-y-2">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Color & Swatches</label>
                                        <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none placeholder-zinc-600" placeholder="Color Name (e.g. Navy Blue)" />
                                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                            {COLOR_SWATCHES.map(sw => (
                                                <button
                                                    key={sw.name}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color: sw.name })}
                                                    className={\`w-6 h-6 rounded-full border transition-all \${
                                                        formData.color?.toLowerCase() === sw.name.toLowerCase()
                                                            ? 'border-emerald-400 scale-115 shadow-md ring-2 ring-emerald-500/50'
                                                            : 'border-white/20'
                                                    }\`}
                                                    style={{ backgroundColor: sw.hex }}
                                                    title={sw.name}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="p-3.5">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Description / Condition</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder-zinc-600" placeholder="Description / Condition" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                )}

                `;

content = content.substring(0, startIndex) + newMobileCard + content.substring(endIndex);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated mobile form to unified card!');
