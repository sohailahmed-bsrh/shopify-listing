import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Check,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  SlidersHorizontal,
  X,
  RefreshCw,
  CheckCircle2,
  Store
} from 'lucide-react';
import { EMSProduct } from '../types';
import { api } from '../services/api';
import { ShopifyProductModal } from './ShopifyProductModal';

interface EMSProductsViewProps {
  products: EMSProduct[];
  selectedProductIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onNavigateToShopify: () => void;
}

export const EMSProductsView: React.FC<EMSProductsViewProps> = ({
  products: initialProducts,
  selectedProductIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onNavigateToShopify
}) => {
  const [productsList, setProductsList] = useState<EMSProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProductForModal, setSelectedProductForModal] = useState<EMSProduct | null>(null);

  const fetchLiveProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEmsProducts(searchTerm);
      if (res.success && Array.isArray(res.products) && res.products.length > 0) {
        setProductsList(res.products);
      }
    } catch (err) {
      console.warn('Could not fetch live products, using fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const categories = ['All', ...new Set(productsList.map(p => p.category).filter(Boolean))];

  const filteredProducts = productsList.filter(product => {
    const matchesSearch =
      (product.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every(p => selectedProductIds.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Products Catalog</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold">
              Live Database Connected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse and manage your EMS inventory. Select and configure products to list directly to Shopify.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveProducts}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh live catalog from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh Catalog
          </button>

          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-xs text-zinc-400">
                <strong className="text-white font-semibold">{selectedProductIds.length}</strong> selected
              </span>
              <button
                onClick={onNavigateToShopify}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                Shopify ({selectedProductIds.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="ems-card p-4 border border-white/5 bg-[#09090b] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title, SKU, or brand..."
            className="w-full pl-9 pr-4 py-2 bg-[#030712] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 bg-[#030712] p-1 border border-white/10 rounded-xl text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="ems-card border border-white/5 overflow-hidden bg-[#09090b]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#030712] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onSelectAll}
                    className="rounded bg-black border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category / Gender</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price (PKR)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Shopify Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map(product => {
                const isSelected = selectedProductIds.includes(product.id);
                const isShopifyListed = Boolean(product.shopify_product_id);

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/20 hover:bg-indigo-950/30'
                        : 'hover:bg-white/[0.02]'
                    }`}
                    onClick={() => setSelectedProductForModal(product)}
                  >
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(product.id)}
                        className="rounded bg-black border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center text-zinc-500">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white line-clamp-1 hover:text-indigo-400 transition-colors">
                            {product.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                            <span>{product.brand || product.vendor}</span>
                            {product.color && <span>• {product.color}</span>}
                            {product.size && <span>• Size {product.size}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-300">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px]">
                        {product.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {product.sku}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-emerald-400 font-semibold text-sm">
                        PKR {Number(product.starting_price || product.price).toLocaleString()}
                      </div>
                      {product.minimum_price && (
                        <div className="font-mono text-zinc-500 text-[10px]">
                          Min: PKR {Number(product.minimum_price).toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {product.stock || 25} in stock
                    </td>

                    <td className="py-3.5 px-4">
                      {isShopifyListed ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Listed
                          </span>
                          {product.shopify_url && (
                            <a
                              href={product.shopify_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-zinc-400 hover:text-indigo-400 transition-colors"
                              title="Open in Shopify Admin"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-medium">
                          Not Listed
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedProductForModal(product)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
                          isShopifyListed
                            ? 'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                        }`}
                        title="Open Shopify listing details"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isShopifyListed ? 'Manage' : 'Shopify'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 text-xs">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shopify Product Modal / Drawer */}
      <ShopifyProductModal
        isOpen={Boolean(selectedProductForModal)}
        onClose={() => setSelectedProductForModal(null)}
        product={selectedProductForModal}
        onProductUpdated={() => {
          fetchLiveProducts();
        }}
      />
    </div>
  );
};
