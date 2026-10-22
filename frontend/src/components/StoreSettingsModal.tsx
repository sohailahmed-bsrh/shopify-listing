import React, { useState, useEffect } from 'react';
import { X, Store, Check, AlertCircle, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { ShopifyStore } from '../types';
import { api } from '../services/api';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoresUpdated: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  onStoresUpdated
}) => {
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New store form state
  const [name, setName] = useState('');
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [apiVersion, setApiVersion] = useState('2024-10');
  const [isDefault, setIsDefault] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStores();
    }
  }, [isOpen]);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStores();
      setStores(res.stores || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!shopDomain || !accessToken) {
      setError('Please provide Shop Domain and Access Token');
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const res = await api.testConnection({
        shop_domain: shopDomain,
        access_token: accessToken,
        api_version: apiVersion
      });
      setTestResult(res);
      if (res.success && res.shop?.name && !name) {
        setName(res.shop.name);
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await api.addStore({
        name,
        shop_domain: shopDomain,
        access_token: accessToken,
        api_version: apiVersion,
        is_default: isDefault
      });

      setShowAddForm(false);
      setName('');
      setShopDomain('');
      setAccessToken('');
      setTestResult(null);
      await loadStores();
      onStoresUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed saving store');
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this store?')) return;
    try {
      await api.deleteStore(id);
      await loadStores();
      onStoresUpdated();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
      <div className="ems-card w-full max-w-2xl bg-[#09090b] border border-white/10 p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Connected Shopify Stores</h2>
              <p className="text-xs text-zinc-400">Manage API credentials & multi-store sync endpoints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              {error}
            </div>
          )}

          {/* Store List */}
          <div className="space-y-2">
            {stores.map(store => (
              <div
                key={store.id}
                className="p-3.5 rounded-xl bg-[#030712] border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{store.name}</span>
                      {Boolean(store.is_default) && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">{store.shop_domain}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://${store.shop_domain}/admin`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                    title="Open Shopify Admin"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer"
                    title="Remove store"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {stores.length === 0 && !isLoading && (
              <div className="text-center py-6 text-zinc-400 text-xs">
                No stores connected yet. Add your Shopify store credentials below.
              </div>
            )}
          </div>

          {/* Add Store Button or Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl text-xs font-semibold text-indigo-400 hover:bg-indigo-500/5 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Connect Another Shopify Store
            </button>
          ) : (
            <form onSubmit={handleSaveStore} className="p-4 rounded-xl bg-[#030712] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">New Store Credentials</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. EMS Flagship"
                    className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Shop Domain (.myshopify.com)</label>
                  <input
                    type="text"
                    required
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-zinc-400 mb-1">Admin API Access Token (shpat_...)</label>
                <input
                  type="password"
                  required
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-[#09090b] border border-white/10 rounded-lg text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded bg-black border-white/20 text-indigo-600 focus:ring-0"
                  />
                  Set as Default Sync Store
                </label>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  Test Connection
                </button>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-xs ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                  {testResult.success ? (
                    <div>✓ Connected to <strong>{testResult.shop?.name}</strong> ({testResult.shop?.currency}, {testResult.shop?.plan_name})</div>
                  ) : (
                    <div>✗ Connection error: {testResult.error}</div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Save Store
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
