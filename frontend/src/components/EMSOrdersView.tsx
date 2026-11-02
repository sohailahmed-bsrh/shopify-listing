import React from 'react';
import { Package, Inbox, AlertCircle, ShoppingCart } from 'lucide-react';

export const EMSOrdersView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">EMS Orders</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Internal sales orders and fulfillment pipeline across connected channels.
        </p>
      </div>

      <div className="ems-card p-12 border border-white/5 bg-[#09090b] flex flex-col items-center justify-center text-center rounded-2xl min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No Orders Found</h3>
        <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
          There are currently no active customer orders recorded in the local store session. Orders placed through sales channels will appear here once connected.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
          Status: Ready for incoming channel webhook orders
        </div>
      </div>
    </div>
  );
};
