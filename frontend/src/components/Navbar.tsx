import React from 'react';
import { Sparkles, Plus, Store, CheckCircle2, ChevronDown, Bell } from 'lucide-react';
import { ShopifyStore } from '../types';

interface NavbarProps {
  stores: ShopifyStore[];
  currentStoreId?: string;
  onSelectStore: (storeId: string) => void;
  onNewListing: () => void;
  onOpenStoreModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stores,
  currentStoreId,
  onSelectStore,
  onNewListing,
  onOpenStoreModal
}) => {
  const activeStore = stores.find(s => s.id === currentStoreId) || stores[0];

  return (
    <header className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Store Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#030712] border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <select
              value={currentStoreId || activeStore?.id || ''}
              onChange={(e) => onSelectStore(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              {stores.map(store => (
                <option key={store.id} value={store.id} className="bg-[#09090b] text-white">
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenStoreModal}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 text-xs transition-colors cursor-pointer"
            title="Configure Shopify Stores"
          >
            <Store className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Shopify API v2024-10
        </div>

        <button
          onClick={onNewListing}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Listing
        </button>
      </div>
    </header>
  );
};
