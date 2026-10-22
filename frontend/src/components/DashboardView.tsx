import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Store,
  ExternalLink,
  Plus,
  Mic,
  TrendingUp,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { DashboardStats, Listing } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNewListing: () => void;
  onOpenVoice: () => void;
  onOpenStores: () => void;
  onEditListing: (listing: Listing) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onNewListing,
  onOpenVoice,
  onOpenStores,
  onEditListing
}) => {
  const chartData = stats?.categoryDistribution?.map(c => ({
    name: c.category,
    count: c.count
  })) || [
    { name: 'Apparel', count: 12 },
    { name: 'Electronics', count: 8 },
    { name: 'Footwear', count: 6 },
    { name: 'Home Goods', count: 4 }
  ];

  const syncActivityData = [
    { day: 'Mon', synced: 4, drafts: 2 },
    { day: 'Tue', synced: 7, drafts: 3 },
    { day: 'Wed', synced: 5, drafts: 6 },
    { day: 'Thu', synced: 11, drafts: 4 },
    { day: 'Fri', synced: 14, drafts: 5 },
    { day: 'Sat', synced: 9, drafts: 2 },
    { day: 'Sun', synced: 16, drafts: 4 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action Bar */}
      <div className="ems-card p-6 border border-white/10 relative overflow-hidden bg-gradient-to-r from-[#09090b] via-[#0d1020] to-[#09090b]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Shopify Automated Merchandising Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Listing Automation Command Center
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Create SEO-optimized Shopify listings in seconds using Gemini AI, transcribe voice memos with Whisper, and store high-resolution media on Oracle Cloud S3.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVoice}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-indigo-400" />
              Voice Memo
            </button>

            <button
              onClick={onNewListing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create New Listing
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total */}
        <div className="ems-card p-5 border border-white/5 ems-card-hover">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Listings</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.total_listings ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-semibold">{stats?.syncRate ?? 100}%</span> sync efficiency
          </div>
        </div>

        {/* Metric 2: Synced */}
        <div className="ems-card p-5 border border-white/5 ems-card-hover">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Live on Shopify</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.synced_listings ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
            Active in Shopify Admin
          </div>
        </div>

        {/* Metric 3: Drafts */}
        <div className="ems-card p-5 border border-white/5 ems-card-hover">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Drafts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.draft_listings ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400">
            Ready for review & publish
          </div>
        </div>

        {/* Metric 4: Stores */}
        <div className="ems-card p-5 border border-white/5 ems-card-hover cursor-pointer" onClick={onOpenStores}>
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Connected Stores</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.total_stores ?? 1}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-400">
            Manage multi-store endpoints →
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Velocity Area Chart */}
        <div className="ems-card p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Listing Sync Velocity (7-Day)</h3>
            </div>
            <span className="text-[11px] text-zinc-400">Products pushed per day</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={syncActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="syncGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '12px' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Area type="monotone" dataKey="synced" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#syncGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="ems-card p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Product Category Distribution</h3>
            </div>
            <span className="text-[11px] text-zinc-400">Top catalog segments</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Listings Table */}
      <div className="ems-card p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Automation Queue</h3>
            <p className="text-xs text-zinc-400">Recent draft and published products</p>
          </div>
          <button
            onClick={onNewListing}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            + New Listing
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#030712] text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Store</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.recentListings && stats.recentListings.length > 0 ? (
                stats.recentListings.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">ID: {item.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-medium">
                      ${item.price}
                    </td>
                    <td className="py-3 px-3 text-zinc-300">
                      {item.store_name || 'Default Store'}
                    </td>
                    <td className="py-3 px-3">
                      {item.sync_status === 'synced' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[10px]">
                          ✓ Synced
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[10px]">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => onEditListing(item)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      {item.shopify_url && (
                        <a
                          href={item.shopify_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs text-zinc-400 hover:text-white"
                          title="Open in Shopify"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                    No products created yet. Click "Create New Listing" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
