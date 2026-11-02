import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Tag,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  MessageSquare,
  Volume2,
  Video,
  Store
} from 'lucide-react';
import { EMSProduct } from '../types';
import { api } from '../services/api';

interface ShopifyProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: EMSProduct | null;
  onProductUpdated?: () => void;
}

export const ShopifyProductModal: React.FC<ShopifyProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'shopify' | 'whatsapp'>('shopify');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string | number>('');
  const [vendor, setVendor] = useState('');
  const [productType, setProductType] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('DRAFT');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Link check state
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [linkCheckResult, setLinkCheckResult] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setPrice(product.starting_price || product.price || '0.00');
      setVendor(product.brand || product.vendor || 'EMS Originals');
      setProductType(product.category || (product.gender ? `${product.brand || 'EMS'} ${product.gender}` : 'Footwear & Apparel'));
      setTags(Array.isArray(product.tags) ? product.tags.join(', ') : (product.brand ? `${product.brand}, ${product.gender || ''}, ${product.color || ''}` : 'EMS'));
      setStatus('DRAFT');
      setDescription(product.description || `High quality ${product.title}. Crafted for style, comfort, and durability.`);
      setFeedback(null);
      setLinkCheckResult(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const shopifyId = product.shopify_product_id;
  const numericId = shopifyId ? shopifyId.split('/').pop() : null;
  const adminUrl = numericId ? `https://devsil-store.myshopify.com/admin/products/${numericId}` : null;

  // Gather all images (main + extra)
  const images = [];
  if (product.image) images.push(product.image);
  if (Array.isArray(product.extra_images)) {
    for (const img of product.extra_images) {
      if (img && !images.includes(img)) images.push(img);
    }
  }

  const handlePublishToShopify = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.publishEmsProductToShopify({
        ems_id: product.id,
        title,
        price,
        vendor,
        product_type: productType,
        tags,
        status,
        description,
        images
      });

      setFeedback({
        type: 'success',
        text: shopifyId ? 'Successfully updated on Shopify!' : 'Successfully listed to Shopify store!'
      });

      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to list product on Shopify'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunLinkCheck = async () => {
    if (!shopifyId) return;
    setIsCheckingLink(true);
    try {
      const res = await api.checkShopifyLink(shopifyId);
      setLinkCheckResult(res?.check?.statusText || 'Status verified');
    } catch (err: any) {
      setLinkCheckResult(`Check failed: ${err.message}`);
    } finally {
      setIsCheckingLink(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#030712]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{product.title}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span className="text-zinc-300 font-medium">PKR {Number(product.starting_price || product.price).toLocaleString()}</span>
                {shopifyId && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Listed on Shopify
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Shopify Store vs WhatsApp Agent) */}
        <div className="flex border-b border-white/10 bg-[#09090b] px-5 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('shopify')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'shopify'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Store className="w-4 h-4" />
            Shopify Store Details
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp & Agent Pitch
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-zinc-300">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/25 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {activeTab === 'shopify' ? (
            <div className="space-y-5">
              {/* Connected Store Info Card */}
              <div className="p-4 rounded-xl bg-[#111318] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                    🛍️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">devsil-store.myshopify.com</span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Shopify Admin API GraphQL v2024-10</p>
                  </div>
                </div>

                {adminUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      Open in Admin <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={handleRunLinkCheck}
                      disabled={isCheckingLink}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCheckingLink ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                      Check Link
                    </button>
                  </div>
                )}
              </div>

              {linkCheckResult && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>{linkCheckResult}</span>
                </div>
              )}

              {/* Product Photos Section */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                    Product Imagery ({images.length} photos ready for staged upload)
                  </label>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                        <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-indigo-600/90 text-[8px] font-bold text-white px-1.5 py-0.5 rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Shopify Product Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500 font-medium"
                    placeholder="e.g. Nike Air Zoom Pegasus 40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Store Listing Price (PKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500 font-mono"
                    placeholder="5000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Vendor / Brand</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. Nike"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Product Type / Category</label>
                  <input
                    type="text"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. Footwear & Apparel"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Publication Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE')}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="DRAFT">Draft (Recommended for review)</option>
                    <option value="ACTIVE">Active (Live immediately on storefront)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. Nike, unisex, white, sneakers"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                  placeholder="Enter product description or specifications..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* WhatsApp Sales Flow Card */}
              <div className="p-4 rounded-xl bg-[#111318] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold text-xs">
                      WA
                    </span>
                    <span className="font-bold text-white">WhatsApp Direct Lead Configuration</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    Active Channel
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Starting Price (Ad Price)</span>
                    <span className="font-mono text-base font-bold text-white mt-1 block">
                      PKR {Number(product.starting_price || product.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Min Offer Limit (Agent Bottom)</span>
                    <span className="font-mono text-base font-bold text-amber-400 mt-1 block">
                      PKR {product.minimum_price ? Number(product.minimum_price).toLocaleString() : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voice Note Pitch */}
              {product.voice_note_url && (
                <div className="p-4 rounded-xl bg-[#111318] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Volume2 className="w-4 h-4" />
                    <span>Voice Note Sales Pitch</span>
                  </div>
                  <audio controls src={product.voice_note_url} className="w-full mt-1" />
                </div>
              )}

              {/* Video Pitch */}
              {product.video_url && (
                <div className="p-4 rounded-xl bg-[#111318] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Video className="w-4 h-4" />
                    <span>Product Video Demo</span>
                  </div>
                  <video controls src={product.video_url} className="w-full max-h-56 rounded-xl object-contain bg-black" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between bg-[#030712]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublishToShopify}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Staged Upload & Syncing...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{shopifyId ? 'Sync Changes to Shopify Store' : 'List on Shopify Store Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
