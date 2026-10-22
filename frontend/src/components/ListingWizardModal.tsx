import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mic,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Listing, ListingVariant, ListingMedia, ShopifyStore, ListingTemplate } from '../types';
import { MediaUploader } from './MediaUploader';
import { VariantsManager } from './VariantsManager';
import { VoiceRecorder } from './VoiceRecorder';
import { api } from '../services/api';

interface ListingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Listing | null;
  stores: ShopifyStore[];
}

export const ListingWizardModal: React.FC<ListingWizardModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
  stores
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'description' | 'media' | 'variants' | 'publish' | 'voice'>('info');

  // Form Fields
  const [title, setTitle] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [vendor, setVendor] = useState('EMS Originals');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // Pricing & Inventory
  const [price, setPrice] = useState<number | string>(49.99);
  const [compareAtPrice, setCompareAtPrice] = useState<number | string>('');
  const [costPerItem, setCostPerItem] = useState<number | string>('');
  const [sku, setSku] = useState('EMS-001');
  const [barcode, setBarcode] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState<number>(20);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Variants & Media
  const [variants, setVariants] = useState<ListingVariant[]>([]);
  const [media, setMedia] = useState<ListingMedia[]>([]);

  // AI & Automation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('persuasive and professional');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<any>(null);

  // Templates
  const [templates, setTemplates] = useState<ListingTemplate[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (initialData) {
        setTitle(initialData.title || '');
        setDescriptionHtml(initialData.description_html || '');
        setVendor(initialData.vendor || 'EMS Originals');
        setProductType(initialData.product_type || '');
        setCategory(initialData.category || '');
        setTags(initialData.tags || '');
        setStatus(initialData.status === 'active' ? 'active' : 'draft');
        setSelectedStoreId(initialData.store_id || (stores[0]?.id ?? ''));
        setPrice(initialData.price || 0);
        setCompareAtPrice(initialData.compare_at_price || '');
        setCostPerItem(initialData.cost_per_item || '');
        setSku(initialData.sku || '');
        setBarcode(initialData.barcode || '');
        setInventoryQuantity(initialData.inventory_quantity || 0);
        setSeoTitle(initialData.seo_title || '');
        setSeoDescription(initialData.seo_description || '');
        setVariants(initialData.variants || []);
        setMedia(initialData.media || []);
      } else {
        // Reset defaults
        resetForm();
      }
    }
  }, [isOpen, initialData, stores]);

  const loadTemplates = async () => {
    try {
      const res = await api.getTemplates();
      setTemplates(res.templates || []);
    } catch (e) {}
  };

  const resetForm = () => {
    setTitle('');
    setDescriptionHtml('');
    setVendor('EMS Originals');
    setProductType('');
    setCategory('');
    setTags('premium, new-arrival, trending');
    setStatus('draft');
    setSelectedStoreId(stores[0]?.id || '');
    setPrice(39.99);
    setCompareAtPrice(49.99);
    setCostPerItem(12.50);
    setSku(`EMS-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode('');
    setInventoryQuantity(25);
    setSeoTitle('');
    setSeoDescription('');
    setVariants([]);
    setMedia([]);
    setAiPrompt('');
    setPublishSuccess(null);
    setError(null);
    setActiveTab('info');
  };

  // AI Magic Generation
  const handleGenerateWithAi = async () => {
    if (!aiPrompt && !title) {
      setError('Please provide a product concept or rough title for AI generation');
      return;
    }

    setIsGeneratingAi(true);
    setError(null);

    try {
      const promptText = aiPrompt || title;
      const res = await api.generateProductWithAi(promptText, category, aiTone);
      const data = res.data;

      if (data) {
        setTitle(data.title);
        setSeoTitle(data.seo_title);
        setSeoDescription(data.seo_description);
        setDescriptionHtml(data.description_html);
        if (data.product_type) setProductType(data.product_type);
        if (data.category) setCategory(data.category);
        if (data.tags) setTags(data.tags.join(', '));
        if (data.suggested_price) setPrice(data.suggested_price);
        if (data.suggested_compare_at_price) setCompareAtPrice(data.suggested_compare_at_price);

        // Map suggested variants if generated
        if (data.suggested_variants && data.suggested_variants.length > 0) {
          const generatedVars = data.suggested_variants.map(v => ({
            option1_name: 'Color',
            option1_value: v.option1,
            option2_name: v.option2 ? 'Size' : undefined,
            option2_value: v.option2,
            price: v.price || data.suggested_price || 39.99,
            sku: `${sku}-${v.sku_suffix || 'VAR'}`,
            inventory_quantity: 15
          }));
          setVariants(generatedVars);
        }
      }
    } catch (err: any) {
      setError(err.message || 'AI generation failed');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle Voice-to-Listing Parsing
  const handleVoiceParsed = (parsed: any, transcript: string, audioUrl?: string) => {
    if (parsed.title) setTitle(parsed.title);
    if (parsed.seo_title) setSeoTitle(parsed.seo_title);
    if (parsed.seo_description) setSeoDescription(parsed.seo_description);
    if (parsed.description_html) setDescriptionHtml(parsed.description_html);
    if (parsed.product_type) setProductType(parsed.product_type);
    if (parsed.vendor) setVendor(parsed.vendor);
    if (parsed.tags) setTags(Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags);
    if (parsed.price) setPrice(parsed.price);
    if (parsed.compare_at_price) setCompareAtPrice(parsed.compare_at_price);
    if (parsed.cost_per_item) setCostPerItem(parsed.cost_per_item);

    if (parsed.variants && parsed.variants.length > 0) {
      setVariants(parsed.variants.map((v: any) => ({
        option1_name: v.option1 ? 'Option' : 'Title',
        option1_value: v.option1 || 'Default',
        option2_name: v.option2 ? 'Sub-Option' : undefined,
        option2_value: v.option2,
        price: v.price || parsed.price || 39.99,
        inventory_quantity: v.inventory_quantity || 10,
        sku: `${sku}-VOICE`
      })));
    }

    setActiveTab('info');
  };

  // Apply template
  const applyTemplate = (t: ListingTemplate) => {
    setDescriptionHtml(prev => `${prev ? prev + '<hr/>' : ''}${t.description_template || ''}`);
    if (t.default_vendor && !vendor) setVendor(t.default_vendor);
    if (t.default_tags) {
      setTags(prev => prev ? `${prev}, ${t.default_tags}` : t.default_tags);
    }
  };

  // Save Draft to EMS Database
  const handleSaveListing = async () => {
    if (!title) {
      setError('Product title is required');
      setActiveTab('info');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      store_id: selectedStoreId || null,
      title,
      description_html: descriptionHtml,
      vendor,
      product_type: productType,
      category,
      tags,
      status,
      price: Number(price) || 0,
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      cost_per_item: costPerItem ? Number(costPerItem) : null,
      sku,
      barcode,
      inventory_quantity: Number(inventoryQuantity) || 0,
      seo_title: seoTitle || title,
      seo_description: seoDescription,
      variants,
      media
    };

    try {
      if (initialData?.id) {
        await api.updateListing(initialData.id, payload);
      } else {
        await api.createListing(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed saving listing');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish to Shopify directly
  const handlePublishNow = async () => {
    if (!title) {
      setError('Product title is required');
      setActiveTab('info');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setPublishSuccess(null);

    try {
      // 1. Save or update listing in DB first
      const payload = {
        store_id: selectedStoreId || null,
        title,
        description_html: descriptionHtml,
        vendor,
        product_type: productType,
        category,
        tags,
        status,
        price: Number(price) || 0,
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        cost_per_item: costPerItem ? Number(costPerItem) : null,
        sku,
        barcode,
        inventory_quantity: Number(inventoryQuantity) || 0,
        seo_title: seoTitle || title,
        seo_description: seoDescription,
        variants,
        media
      };

      let listingId = initialData?.id;
      if (!listingId) {
        const createRes = await api.createListing(payload);
        listingId = createRes.id;
      } else {
        await api.updateListing(listingId, payload);
      }

      // 2. Publish to Shopify
      const publishRes = await api.publishListing(listingId, selectedStoreId);
      setPublishSuccess(publishRes);
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to publish product to Shopify');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl overflow-hidden">
      <div className="ems-card w-full max-w-5xl bg-[#09090b] border border-white/10 rounded-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-[#030712]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {initialData ? 'Edit Product Listing' : 'Shopify Listing Studio'}
              </h2>
              <p className="text-xs text-zinc-400">
                AI automated product synthesis, Oracle S3 media sync & Shopify Admin publish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-white/10 bg-[#030712]/30 overflow-x-auto text-xs py-2">
          {[
            { id: 'info', label: '1. Basic & AI Magic', icon: Sparkles },
            { id: 'description', label: '2. Rich Description', icon: FileText },
            { id: 'media', label: `3. Media Studio (${media.length})`, icon: ImageIcon },
            { id: 'variants', label: `4. Variants (${variants.length})`, icon: Layers },
            { id: 'voice', label: '🎙️ Voice Memo', icon: Mic },
            { id: 'publish', label: '5. Shopify Publish', icon: Send }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              {error}
            </div>
          )}

          {publishSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Published successfully to Shopify!</span>
                  <div className="text-[11px] text-emerald-400/80">Product ID: {publishSuccess.shopify_product_id}</div>
                </div>
              </div>
              {publishSuccess.shopify_url && (
                <a
                  href={publishSuccess.shopify_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View in Shopify Admin
                </a>
              )}
            </div>
          )}

          {/* TAB 1: BASIC INFO & AI GENERATOR */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* AI Quick Generator Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent border border-indigo-500/30 relative">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  Gemini 1.5 Auto-Listing Synthesizer
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Enter a quick product concept or rough notes. AI will automatically generate your Title, High-converting Description, Bullet Points, SEO metadata, and Tags.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Ergonomic wireless mechanical keyboard with RGB backlighting, Bluetooth 5.2, hot-swappable"
                    className="flex-1 px-3.5 py-2.5 bg-[#030712] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateWithAi}
                    disabled={isGeneratingAi}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Title & Organization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Product Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Tactical Performance Waterproof Jacket"
                    className="w-full px-3.5 py-2.5 bg-[#030712] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Brand / Vendor</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="EMS Originals"
                    className="w-full px-3.5 py-2.5 bg-[#030712] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category, Type & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Product Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Apparel & Accessories"
                    className="w-full px-3 py-2 bg-[#030712] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Product Type</label>
                  <input
                    type="text"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Outerwear"
                    className="w-full px-3 py-2 bg-[#030712] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Shopify Tags</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="jacket, waterproof, outdoor"
                    className="w-full px-3 py-2 bg-[#030712] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Base Pricing & Inventory Bar */}
              <div className="p-4 rounded-xl bg-[#030712] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Pricing & Inventory Baseline</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Selling Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-emerald-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Compare-at ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="e.g. 69.99"
                      className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-zinc-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Cost per Item ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPerItem}
                      onChange={(e) => setCostPerItem(e.target.value)}
                      placeholder="e.g. 15.00"
                      className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-zinc-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Default SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={inventoryQuantity}
                      onChange={(e) => setInventoryQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Google SERP Preview */}
              <div className="p-4 rounded-xl bg-[#030712] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Search Engine Optimization (SEO)</h4>
                  <span className="text-[11px] text-zinc-500">Google SERP Snippet Preview</span>
                </div>

                <div className="p-3.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    https://yourstore.com/products/
                    <span className="text-zinc-500 font-mono">{title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}</span>
                  </div>
                  <div className="text-sm font-semibold text-indigo-400 hover:underline cursor-pointer">
                    {seoTitle || title || 'Product Title'}
                  </div>
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    {seoDescription || 'No meta description provided. Search engines will automatically generate one from page content.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">SEO Page Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Custom Page Title for Search Engines"
                      className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Meta Description</label>
                    <input
                      type="text"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Brief search result summary"
                      className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RICH DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="space-y-4">
              {/* Template Quick Applier */}
              {templates.length > 0 && (
                <div className="p-3 rounded-xl bg-[#030712] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Apply Pre-configured Template:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-indigo-600/20 text-zinc-300 hover:text-indigo-300 border border-white/5 text-xs transition-colors cursor-pointer"
                      >
                        + {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HTML Source Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span>HTML Description Content</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{descriptionHtml.length} characters</span>
                  </div>
                  <textarea
                    rows={14}
                    value={descriptionHtml}
                    onChange={(e) => setDescriptionHtml(e.target.value)}
                    placeholder="<h3>Product Headline</h3><p>Enter your product description or let Gemini generate it...</p>"
                    className="w-full p-3 bg-[#030712] border border-white/10 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Live Styled Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      Live Storefront Render
                    </span>
                    <span className="text-zinc-500 text-[11px]">Formatted as on Shopify theme</span>
                  </div>
                  <div className="h-[285px] p-4 bg-[#030712] border border-white/10 rounded-xl overflow-y-auto prose prose-invert prose-sm max-w-none text-zinc-300 leading-normal">
                    {descriptionHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                        Empty description. Type HTML or use AI generator.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA STUDIO */}
          {activeTab === 'media' && (
            <MediaUploader
              media={media}
              onChange={(newMedia) => setMedia(newMedia)}
            />
          )}

          {/* TAB 4: VARIANTS MATRIX */}
          {activeTab === 'variants' && (
            <VariantsManager
              basePrice={price}
              baseSku={sku}
              variants={variants}
              onChange={(newVariants) => setVariants(newVariants)}
            />
          )}

          {/* TAB: VOICE RECORDER */}
          {activeTab === 'voice' && (
            <VoiceRecorder onParsedProduct={handleVoiceParsed} />
          )}

          {/* TAB 5: SHOPIFY PUBLISH SETTINGS */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#030712] border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Publishing Target & Visibility</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-semibold">Target Shopify Store</label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#09090b] border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
                    >
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.shop_domain})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1.5 font-semibold">Storefront Status</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus('draft')}
                        className={`flex-1 py-2 rounded-xl font-semibold border transition-all cursor-pointer ${
                          status === 'draft'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                            : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                        }`}
                      >
                        Draft (Hidden from buyers)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('active')}
                        className={`flex-1 py-2 rounded-xl font-semibold border transition-all cursor-pointer ${
                          status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                        }`}
                      >
                        Active (Live immediately)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready to Publish Summary Card */}
              <div className="p-5 rounded-2xl bg-[#030712] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white mb-1">Push Directly to Shopify Admin</h4>
                  <p className="text-xs text-zinc-400 max-w-lg">
                    This will create the product on your live Shopify store, upload all images to Shopify CDN, generate variants, set inventory tracking, and assign tags.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishNow}
                  disabled={isPublishing || !title}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Publishing to Shopify...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publish to Shopify Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 border-t border-white/10 bg-[#030712]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {variants.length} variants • {media.length} images
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveListing}
              disabled={isSaving}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-white/10"
            >
              {isSaving ? 'Saving Draft...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={handlePublishNow}
              disabled={isPublishing || !title}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Publish to Shopify
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
