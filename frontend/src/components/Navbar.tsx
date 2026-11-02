import React from 'react';
import { ShoppingBag, ArrowRight, Package } from 'lucide-react';

interface NavbarProps {
  currentPage: 'products' | 'orders' | 'shopify';
  stagedCount: number;
  onNavigateToShopify: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  stagedCount,
  onNavigateToShopify
}) => {
  return (
    <header className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-400">EMS Workspace</span>
        <span className="text-zinc-600">/</span>
        <span className="text-xs font-bold text-white capitalize">
          {currentPage === 'products'
            ? 'Products Catalog'
            : currentPage === 'orders'
            ? 'Orders Pipeline'
            : 'Shopify Listing Automation'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {currentPage !== 'shopify' && stagedCount > 0 && (
          <button
            onClick={onNavigateToShopify}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95 animate-in fade-in duration-200"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shopify Staging ({stagedCount})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          EMS System Active
        </div>
      </div>
    </header>
  );
};
