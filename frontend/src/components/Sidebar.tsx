import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Mic,
  FileText,
  Store,
  Settings,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeStoreName?: string;
  onOpenStoreModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeStoreName = 'Main EMS Store',
  onOpenStoreModal
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'listings', label: 'Products & Listings', icon: ShoppingBag },
    { id: 'voice', label: 'Voice-to-Listing', icon: Mic, badge: 'Whisper' },
    { id: 'templates', label: 'Listing Templates', icon: FileText },
    { id: 'stores', label: 'Shopify Stores', icon: Store }
  ];

  return (
    <aside className="w-64 bg-[#09090b] border-r border-white/5 flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white tracking-wider">EMS</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Shopify Listing Auto</p>
          </div>
        </div>

        {/* Store Context Badge */}
        <div className="p-3 mx-3 mt-4 rounded-xl bg-[#030712] border border-white/5 flex items-center justify-between cursor-pointer hover:border-indigo-500/30 transition-all" onClick={onOpenStoreModal}>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="text-xs font-medium text-zinc-300 truncate">{activeStoreName}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-white/5 space-y-2 text-[11px] text-zinc-500">
        <div className="flex items-center justify-between">
          <span>Engine:</span>
          <span className="text-zinc-400 font-mono">Gemini 1.5 + Whisper</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Storage:</span>
          <span className="text-zinc-400 font-mono">Oracle S3 Compat</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Database:</span>
          <span className="text-emerald-400 font-mono">MySQL Pool</span>
        </div>
      </div>
    </aside>
  );
};
