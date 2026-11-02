import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  Store,
  Inbox,
  X,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { EMSProduct } from '../types';

interface ShopifyAutomationPageProps {
  selectedProducts: EMSProduct[];
  onRemoveProduct: (id: string) => void;
  onClearAll: () => void;
  onBackToProducts: () => void;
}

export const ShopifyAutomationPage: React.FC<ShopifyAutomationPageProps> = ({
  selectedProducts,
  onRemoveProduct,
  onClearAll,
  onBackToProducts
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [previewProduct, setPreviewProduct] = useState<EMSProduct | null>(null);

  const categories = ['All', ...new Set(selectedProducts.map(p => p.category))];

  const filteredProducts = selectedProducts.filter(product => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <button
              onClick={onBackToProducts}
              className="hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              EMS Products
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200 font-semibold">Shopify Listing Automation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            Shopify Listing Automation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Review and stage selected products from your EMS catalog before pushing to Shopify.
          </p>
        </div>

        <button
          onClick={onBackToProducts}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to EMS Products
        </button>
      </div>

      {/* Minimal Shopify Connection & Status Banner (Honest & Focused) */}
      <div className="p-4 rounded-2xl bg-[#09090b] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Shopify Connection Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Pending API Credentials
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              Live storefront synchronization will be enabled once Shopify Admin API credentials are provided. Products are staged locally in the frontend.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-mono shrink-0">
          <span>Staging Engine: Active</span>
          <span>•</span>
          <span>Transferred Items: {selectedProducts.length}</span>
        </div>
      </div>

      {/* Primary Tab Navigation: Products / Orders */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 bg-[#030712] p-1 border border-white/10 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Products ({selectedProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders (0)
          </button>
        </div>

        {activeTab === 'products' && selectedProducts.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Clear Staged Selection
          </button>
        )}
      </div>

      {/* PRODUCTS TAB CONTENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {selectedProducts.length > 0 ? (
            <>
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#09090b] border border-white/5 p-3.5 rounded-xl">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search staged products..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#030712] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-zinc-500 text-xs shrink-0">Filter:</span>
                  <div className="flex items-center gap-1 bg-[#030712] p-1 border border-white/10 rounded-lg text-xs">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-indigo-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Staged Products Table (Order Preserved!) */}
              <div className="ems-card border border-white/5 overflow-hidden bg-[#09090b]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#030712] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4 w-12">#</th>
                        <th className="py-3 px-4">Product Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Selling Price</th>
                        <th className="py-3 px-4">Inventory</th>
                        <th className="py-3 px-4">Staging Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.map((product, index) => (
                        <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-zinc-500 text-[11px]">
                            {index + 1}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-11 h-11 rounded-lg object-cover bg-zinc-900 border border-white/10 shrink-0"
                              />
                              <div>
                                <div
                                  onClick={() => setPreviewProduct(product)}
                                  className="font-semibold text-white hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1"
                                >
                                  {product.title}
                                </div>
                                <div className="text-[11px] text-zinc-500 mt-0.5">
                                  {product.vendor}
                                  {product.variantsCount && (
                                    <span className="ml-2 text-zinc-400">
                                      • {product.variantsCount} variants
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-zinc-300">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[11px]">
                              {product.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-zinc-400">
                            {product.sku}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                            ${product.price.toFixed(2)}
                            {product.compare_at_price && (
                              <span className="block text-[11px] text-zinc-500 line-through font-normal">
                                ${product.compare_at_price.toFixed(2)}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-zinc-300">
                            {product.stock} units
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Ready for Review
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPreviewProduct(product)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Review
                              </button>
                              <button
                                onClick={() => onRemoveProduct(product.id)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Remove from staging"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Clear Honest Empty State */
            <div className="ems-card p-12 border border-white/5 bg-[#09090b] flex flex-col items-center justify-center text-center rounded-2xl min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                No Products Selected from EMS
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
                You have not staged any products yet. Go back to your EMS Products catalog, check the boxes next to the items you wish to automate, and click the <strong>Shopify</strong> button.
              </p>
              <button
                onClick={onBackToProducts}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                Select Products in EMS Catalog
              </button>
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB CONTENT (100% Honest Empty State) */}
      {activeTab === 'orders' && (
        <div className="ems-card p-12 border border-white/5 bg-[#09090b] flex flex-col items-center justify-center text-center rounded-2xl min-h-[380px]">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Shopify Orders Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
            Live orders placed on your Shopify store will synchronize and appear in this view once your store API credentials are fully configured and listings are published.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
            No active store connection configured
          </div>
        </div>
      )}

      {/* Product Review Modal / Slide-Over */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="ems-card w-full max-w-lg bg-[#09090b] border border-white/10 p-6 rounded-2xl relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Staged Product Inspection</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <img
                src={previewProduct.image}
                alt={previewProduct.title}
                className="w-24 h-24 rounded-xl object-cover bg-zinc-900 border border-white/10 shrink-0"
              />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{previewProduct.title}</h4>
                <div className="text-xs text-zinc-400">Vendor: {previewProduct.vendor}</div>
                <div className="text-xs font-mono text-zinc-500">SKU: {previewProduct.sku}</div>
                <div className="text-sm font-mono text-emerald-400 font-bold mt-1">
                  ${previewProduct.price.toFixed(2)}
                  {previewProduct.compare_at_price && (
                    <span className="text-xs text-zinc-500 line-through ml-2 font-normal">
                      ${previewProduct.compare_at_price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-zinc-300">Description / Specifications:</span>
              <p className="p-3 bg-[#030712] rounded-xl border border-white/5 text-zinc-300 leading-relaxed">
                {previewProduct.description}
              </p>
            </div>

            {previewProduct.tags && previewProduct.tags.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-zinc-300">Staged Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {previewProduct.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5 text-[11px]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setPreviewProduct(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
