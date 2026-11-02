const fs = require('fs');
const path = require('path');

console.log('--- Applying Products UI Layout Fixes ---');

// 1. Update WhatsAppDashboard.tsx
const dashPath = 'ems_project/frontend/src/components/WhatsAppDashboard.tsx';
let dashContent = fs.readFileSync(dashPath, 'utf8');

// Replace max-w-6xl feed container with max-w-[1700px]
dashContent = dashContent.replace(
    'className="flex-1 overflow-y-auto pb-[85px] md:pb-6 pt-4 px-4 w-full max-w-6xl mx-auto custom-scrollbar"',
    'className="flex-1 overflow-y-auto pb-[85px] md:pb-6 pt-4 px-3 sm:px-6 md:px-8 w-full max-w-[1700px] mx-auto custom-scrollbar"'
);

// Replace FAB max-w-6xl container with max-w-[1700px]
dashContent = dashContent.replace(
    '<div className="w-full max-w-6xl flex justify-end relative">',
    '<div className="w-full max-w-[1700px] flex justify-end relative">'
);

// Expand desktop nav container to max-w-[1700px]
dashContent = dashContent.replace(
    'className="w-full max-w-7xl px-8 flex items-center justify-between mb-3"',
    'className="w-full max-w-[1700px] px-4 sm:px-8 flex items-center justify-between mb-3"'
);

// Make left aside sticky
dashContent = dashContent.replace(
    '<aside className="w-full md:w-64 shrink-0 bg-[#09090b] rounded-2xl border border-white/5 p-4 flex flex-col gap-3 shadow-xl">',
    '<aside className="w-full md:w-64 shrink-0 bg-[#09090b] rounded-2xl border border-white/5 p-4 flex flex-col gap-3 shadow-xl md:sticky md:top-2 self-start">'
);

// Replace the Products right content area
const toolbarAnchor = '{/* Desktop Toolbar (Hidden on Mobile) */}';
const toolbarIdx = dashContent.indexOf(toolbarAnchor);
if (toolbarIdx === -1) {
    console.error('Could not find toolbarAnchor in WhatsAppDashboard.tsx');
    process.exit(1);
}

// Find the end of the products channel block:
// It ends with:
//                                                     )}
//                                                 </div>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 )}
// 
//                             {subTab === 'conversations' && <LiveConversations />}
const conversationsAnchor = "{subTab === 'conversations' && <LiveConversations />}";
const convIdx = dashContent.indexOf(conversationsAnchor);
if (convIdx === -1) {
    console.error('Could not find conversationsAnchor in WhatsAppDashboard.tsx');
    process.exit(1);
}

// In dashContent between toolbarIdx and convIdx, find the last `                                    </div>` before `                            {subTab === 'conversations'`
// Let's check the slice:
const sliceToReplace = dashContent.substring(toolbarIdx, convIdx);

const newRightContent = `{/* Desktop Toolbar (Hidden on Mobile) */}
                                                <div className="hidden md:flex items-center justify-between gap-4 mb-6 w-full flex-wrap">
                                                    <div className="flex items-center gap-3 flex-1 max-w-xl">
                                                        <div className="relative flex-1">
                                                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                            <input 
                                                                type="text" 
                                                                value={searchQuery}
                                                                onChange={e => setSearchQuery(e.target.value)}
                                                                placeholder="Search products by title or brand..." 
                                                                className="pl-11 pr-8 py-2.5 rounded-xl bg-[#18181b] border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50 w-full transition-all placeholder:text-zinc-500 shadow-sm"
                                                            />
                                                            {searchQuery && (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setSearchQuery('')} 
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white p-1"
                                                                    title="Clear search"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-zinc-400 bg-[#18181b] px-3.5 py-2.5 rounded-xl border border-white/5 font-mono whitespace-nowrap">
                                                            {products.length} {products.length === 1 ? 'Product' : 'Products'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {/* View Toggle */}
                                                        <div className="flex bg-[#18181b] border border-white/10 rounded-xl p-1 shadow-md">
                                                            <button 
                                                                type="button"
                                                                onClick={() => setViewMode('grid')} 
                                                                className={\`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold \${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}\`}
                                                                title="Grid View"
                                                            >
                                                                <LayoutGrid size={15} />
                                                                <span>Grid</span>
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setViewMode('list')} 
                                                                className={\`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold \${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}\`}
                                                                title="List View"
                                                            >
                                                                <List size={15} />
                                                                <span>List</span>
                                                            </button>
                                                        </div>

                                                        {/* Add Product Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => { resetForm(); setActiveMobilePage('add-product'); }}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                                                        >
                                                            <Plus size={16} />
                                                            <span>Add Product</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Product Cards Container */}
                                                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 w-full" : "flex flex-col gap-3.5 w-full"}>
                                                    {loading ? (
                                                        <div className="flex items-center justify-center h-48 col-span-full">
                                                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-400"></div>
                                                        </div>
                                                    ) : products.length === 0 ? (
                                                        <div className="text-center text-zinc-400 py-16 text-sm col-span-full bg-[#09090b] rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6">
                                                            <Package size={36} className="text-zinc-600 mb-3" />
                                                            <p className="font-semibold text-white mb-1">No products listed yet</p>
                                                            <p className="text-xs text-zinc-500 max-w-sm mb-4">Start listing products in WhatsApp Catalog to showcase them to buyers or sync to Shopify.</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => { resetForm(); setActiveMobilePage('add-product'); }}
                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                                            >
                                                                <Plus size={15} />
                                                                <span>Add First Product</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        (() => {
                                                            const filteredProducts = products.filter(p => 
                                                                p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                                p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                                                            );
                                                            if (filteredProducts.length === 0) {
                                                                return (
                                                                    <div className="text-center text-zinc-500 py-12 text-sm col-span-full bg-[#09090b] rounded-2xl border border-white/5">
                                                                        No products match your search "{searchQuery}".
                                                                    </div>
                                                                );
                                                            }
                                                            const isGrid = viewMode === 'grid';
                                                            return filteredProducts.map(product => {
                                                                const allImages = getProductAllImages(product);
                                                                const currentImgUrl = allImages[0] || product.main_image_url;
                                                                const isAvailable = (product.status || 'available') === 'available';
                                                                
                                                                return (
                                                                    <div 
                                                                        key={product.id} 
                                                                        onClick={() => handleOpenDetails(product)}
                                                                        className={\`group bg-[#09090b] hover:bg-[#0c0d12] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl flex \${isGrid ? 'flex-col justify-between' : 'flex-col md:flex-row md:items-center justify-between'} gap-4 cursor-pointer w-full\`}
                                                                    >
                                                                        {/* Top/Left Section: Image + Info */}
                                                                        <div className={isGrid ? "w-full flex flex-col gap-3" : "flex items-start sm:items-center gap-4 flex-1 min-w-0"}>
                                                                            {/* Thumbnail & Media Badges */}
                                                                            <div className={isGrid ? "w-full aspect-[4/3] rounded-xl shrink-0 overflow-hidden relative bg-[#18181b] border border-white/5" : "w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 rounded-xl shrink-0 overflow-hidden relative bg-[#18181b] border border-white/5"}>
                                                                                {currentImgUrl ? (
                                                                                    <img src={currentImgUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                                                                                ) : (
                                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                                        <Camera size={24} className="text-zinc-600" />
                                                                                    </div>
                                                                                )}
                                                                                {/* Brand badge top-left */}
                                                                                {product.brand && (
                                                                                    <div className="absolute top-1.5 left-1.5 max-w-[85%] truncate">
                                                                                        <span className="bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider border border-white/10">
                                                                                            {product.brand}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                {/* Media indicators top-right */}
                                                                                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                                                                                    {allImages.length > 1 && (
                                                                                        <span className="bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-zinc-300 border border-white/10">
                                                                                            +{allImages.length - 1}
                                                                                        </span>
                                                                                    )}
                                                                                    {product.voice_note_url && (
                                                                                        <span className="bg-indigo-600/90 text-white p-1 rounded text-[9px]" title="Includes Voice Pitch">
                                                                                            <Volume2 size={10} />
                                                                                        </span>
                                                                                    )}
                                                                                    {product.video_url && (
                                                                                        <span className="bg-emerald-600/90 text-white p-1 rounded text-[9px]" title="Includes Video">
                                                                                            <Video size={10} />
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {/* Status badge bottom */}
                                                                                <div className="absolute bottom-1.5 left-1.5">
                                                                                    {(product.status as any) === 'uploading' ? (
                                                                                        <span className="flex items-center gap-1 bg-amber-500/90 text-white px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse">
                                                                                            <Loader2 size={9} className="animate-spin" /> Uploading
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className={\`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider \${isAvailable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}\`}>
                                                                                            {isAvailable ? 'Available' : 'Sold'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Info Section */}
                                                                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <h4 className="font-bold text-zinc-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors" title={product.title}>
                                                                                        {product.title}
                                                                                    </h4>
                                                                                </div>

                                                                                {/* Attribute Badges */}
                                                                                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                                                                    {product.brand && !isGrid && (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-bold text-white uppercase tracking-wider border border-white/10">
                                                                                            {product.brand}
                                                                                        </span>
                                                                                    )}
                                                                                    {product.gender && (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-medium text-zinc-300 border border-white/5 capitalize">
                                                                                            {product.gender}
                                                                                        </span>
                                                                                    )}
                                                                                    {product.size_original && (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-medium text-zinc-300 border border-white/5">
                                                                                            Size {product.size_original}
                                                                                        </span>
                                                                                    )}
                                                                                    {product.color && (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-medium text-zinc-300 border border-white/5 flex items-center gap-1.5">
                                                                                            <span className="w-2 h-2 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: product.color.toLowerCase().replace(/[^a-z0-9]/g, '') || '#10b981' }}></span>
                                                                                            <span>{product.color}</span>
                                                                                        </span>
                                                                                    )}
                                                                                    {(product as any).stock !== undefined && (product as any).stock !== null && (product as any).stock !== '' && (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-medium text-zinc-300 border border-white/5">
                                                                                            {Number((product as any).stock) > 0 ? (
                                                                                                <span className="text-emerald-400 font-semibold">{(product as any).stock} in stock</span>
                                                                                            ) : (
                                                                                                <span className="text-red-400 font-semibold">Out of stock</span>
                                                                                            )}
                                                                                        </span>
                                                                                    )}
                                                                                    {product.shopify_product_id && (
                                                                                        <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-[10px] font-bold text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                                                                            <Store size={10} />
                                                                                            <span>Shopify Linked</span>
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Description: 2-line clamp for full readability */}
                                                                                {product.description && (
                                                                                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed max-w-2xl" title={product.description}>
                                                                                        {product.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Bottom/Right Section: Price & Action Buttons */}
                                                                        <div className={isGrid ? "flex flex-col gap-3 pt-3 border-t border-white/5 w-full" : "flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/5 w-full md:w-auto"}>
                                                                            {/* Price */}
                                                                            <div className={isGrid ? "flex items-baseline justify-between" : "flex flex-col items-start md:items-end shrink-0"}>
                                                                                <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono">
                                                                                    Rs {product.starting_price}
                                                                                </span>
                                                                                {product.minimum_price && Number(product.minimum_price) !== Number(product.starting_price) && (
                                                                                    <span className="text-xs text-zinc-500 font-mono line-through">
                                                                                        Rs {product.minimum_price}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Action Buttons: fully contained inside card */}
                                                                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                                                {product.voice_note_url && (
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveMediaPreview({ type: 'audio', url: product.voice_note_url as string, title: product.title });
                                                                                        }}
                                                                                        className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-indigo-500/20 transition-colors"
                                                                                        title="Play Voice Pitch"
                                                                                    >
                                                                                        <Volume2 size={13} />
                                                                                        <span>Voice</span>
                                                                                    </button>
                                                                                )}
                                                                                {product.video_url && (
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveMediaPreview({ type: 'video', url: product.video_url as string, title: product.title });
                                                                                        }}
                                                                                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-emerald-500/20 transition-colors"
                                                                                        title="View Video"
                                                                                    >
                                                                                        <Video size={13} />
                                                                                        <span>Video</span>
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setWhatsAppProductForShopify(product);
                                                                                        setSelectedShopifyProduct(null);
                                                                                        setShowShopifyModal(true);
                                                                                    }}
                                                                                    className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 rounded-xl flex items-center gap-1.5 transition-colors border border-purple-500/20 text-xs font-semibold"
                                                                                    title="List on Shopify"
                                                                                >
                                                                                    <Store size={13} />
                                                                                    <span>Shopify</span>
                                                                                </button>
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleEdit(product); setActiveMobilePage('add-product'); }}
                                                                                    className="w-8 h-8 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl flex items-center justify-center transition-colors border border-white/5"
                                                                                    title="Edit Product"
                                                                                >
                                                                                    <Edit3 size={14} />
                                                                                </button>
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                                                                    className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center transition-colors border border-red-500/10"
                                                                                    title="Delete Product"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })()
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            `;

dashContent = dashContent.substring(0, toolbarIdx) + newRightContent + dashContent.substring(convIdx);
fs.writeFileSync(dashPath, dashContent, 'utf8');
console.log('Successfully updated WhatsAppDashboard.tsx layout!');

// 2. Update ShopifyProductsView.tsx
const shopifyViewPath = 'ems_project/frontend/src/components/ShopifyProductsView.tsx';
let shopifyContent = fs.readFileSync(shopifyViewPath, 'utf8');

// Change grid columns from xl:grid-cols-4 to xl:grid-cols-3 2xl:grid-cols-4
shopifyContent = shopifyContent.replace(
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">',
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">'
);

// Ensure title has line-clamp-2 and title attribute in grid cards
shopifyContent = shopifyContent.replace(
    '<h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">',
    '<h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors" title={product.title}>'
);

// Ensure list table has custom-scrollbar and min-w
shopifyContent = shopifyContent.replace(
    '<div className="overflow-x-auto">',
    '<div className="overflow-x-auto custom-scrollbar">'
);

shopifyContent = shopifyContent.replace(
    '<table className="w-full text-left text-sm text-zinc-400">',
    '<table className="w-full text-left text-sm text-zinc-400 min-w-[650px]">'
);

// In list table cell: make sure title does not clip awkwardly
shopifyContent = shopifyContent.replace(
    '<p className="font-semibold text-white leading-snug hover:text-purple-300 transition-colors">',
    '<p className="font-semibold text-white leading-snug hover:text-purple-300 transition-colors line-clamp-2" title={product.title}>'
);

fs.writeFileSync(shopifyViewPath, shopifyContent, 'utf8');
console.log('Successfully updated ShopifyProductsView.tsx layout!');
