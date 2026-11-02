import React from 'react';
import {
  Package,
  ShoppingCart,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentPage: 'products' | 'orders' | 'shopify';
  onSelectPage: (page: 'products' | 'orders' | 'shopify') => void;
  stagedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  stagedCount
}) => {
  const navItems = [
    { id: 'products', label: 'Products Catalog', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    {
      id: 'shopify',
      label: 'Shopify Automation',
      icon: ShoppingBag,
      badge: stagedCount > 0 ? `${stagedCount}` : undefined
    }
  ];

  return (
    <aside className="w-64 bg-[#09090b] border-r border-white/5 flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white tracking-wider">EMS</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                PORTAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">E-Commerce Management</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Catalog & Sales Channels
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-white/5 space-y-2 text-[11px] text-zinc-500">
        <div className="flex items-center justify-between">
          <span>EMS System:</span>
          <span className="text-emerald-400 font-mono">Online</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shopify Integration:</span>
          <span className="text-zinc-400 font-mono">Module Ready</span>
        </div>
      </div>
    </aside>
  );
};
