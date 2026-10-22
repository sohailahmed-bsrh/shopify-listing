import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  ExternalLink,
  Send,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Layers
} from 'lucide-react';
import { Listing } from '../types';
import { api } from '../services/api';

interface ListingsTableViewProps {
  listings: Listing[];
  isLoading: boolean;
  onRefresh: () => void;
  onNewListing: () => void;
  onEditListing: (listing: Listing) => void;
}

export const ListingsTableView: React.FC<ListingsTableViewProps> = ({
  listings,
  isLoading,
  onRefresh,
  onNewListing,
  onEditListing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const filteredListings = listings.filter(l => {
    const matchesSearch =
      l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.tags?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'synced' && l.sync_status === 'synced') ||
      (statusFilter === 'draft' && l.sync_status === 'draft') ||
      (statusFilter === 'failed' && l.sync_status === 'failed');

    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredListings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredListings.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePublishSingle = async (listing: Listing) => {
    setPublishingId(listing.id);
    try {
      await api.publishListing(listing.id);
      onRefresh();
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkPublishing(true);
    try {
      const res = await api.bulkPublishListings(selectedIds);
      alert(`Bulk Publish Completed: ${res.successCount} succeeded, ${res.failedCount} failed.`);
      setSelectedIds([]);
      onRefresh();
    } catch (err: any) {
      alert(`Bulk publish failed: ${err.message}`);
    } finally {
      setIsBulkPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.deleteListing(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#09090b] border border-white/10 p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, SKU, or tag..."
              className="w-full pl-9 pr-4 py-2 bg-[#030712] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#030712] p-1 border border-white/10 rounded-xl text-xs">
            {['all', 'synced', 'draft', 'failed'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkPublish}
              disabled={isBulkPublishing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {isBulkPublishing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Publishing ({selectedIds.length})...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Publish Selected ({selectedIds.length})
                </>
              )}
            </button>
          )}

          <button
            onClick={onRefresh}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
            title="Refresh listings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onNewListing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </button>
        </div>
      </div>

      {/* Listings Table */}
      <div className="ems-card border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#030712] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredListings.length > 0 && selectedIds.length === filteredListings.length}
                    onChange={toggleSelectAll}
                    className="rounded bg-black border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">SKU / Inventory</th>
                <th className="py-3 px-4">Shopify Sync</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredListings.map(listing => {
                const isSelected = selectedIds.includes(listing.id);
                const isPublishing = publishingId === listing.id;

                return (
                  <tr key={listing.id} className={`hover:bg-white/[0.02] ${isSelected ? 'bg-indigo-950/20' : ''}`}>
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(listing.id)}
                        className="rounded bg-black border-white/20 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {listing.thumbnail_url ? (
                          <img
                            src={listing.thumbnail_url}
                            alt=""
                            className="w-11 h-11 rounded-lg object-cover bg-zinc-900 border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div
                            onClick={() => onEditListing(listing)}
                            className="font-semibold text-white hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1"
                          >
                            {listing.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                            <span>{listing.vendor || 'EMS'}</span>
                            {listing.variant_count && listing.variant_count > 0 && (
                              <span className="flex items-center gap-0.5 text-zinc-400">
                                <Layers className="w-3 h-3 text-indigo-400" />
                                {listing.variant_count} variants
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-emerald-400 font-semibold text-sm">
                        ${listing.price}
                      </div>
                      {listing.compare_at_price && (
                        <div className="font-mono text-zinc-500 line-through text-[11px]">
                          ${listing.compare_at_price}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      <div>{listing.sku || 'NO-SKU'}</div>
                      <div className="text-[11px] text-zinc-500">
                        Qty: {listing.inventory_quantity}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {listing.sync_status === 'synced' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Synced
                        </div>
                      ) : listing.sync_status === 'failed' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Failed
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Draft
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {listing.sync_status !== 'synced' && (
                          <button
                            onClick={() => handlePublishSingle(listing)}
                            disabled={isPublishing}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                            title="Push to Shopify"
                          >
                            {isPublishing ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Publish
                          </button>
                        )}

                        {listing.shopify_url && (
                          <a
                            href={listing.shopify_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                            title="View in Shopify Admin"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => onEditListing(listing)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-400 rounded-lg hover:bg-white/5 cursor-pointer"
                          title="Edit listing"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredListings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                    {isLoading ? 'Loading listings...' : 'No listings found matching criteria.'}
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
