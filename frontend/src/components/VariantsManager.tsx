import React, { useState } from 'react';
import { Plus, Trash2, Layers, DollarSign, RefreshCw, Sparkles } from 'lucide-react';
import { ListingVariant } from '../types';

interface VariantsManagerProps {
  basePrice: number | string;
  baseSku?: string;
  variants: ListingVariant[];
  onChange: (variants: ListingVariant[]) => void;
}

export const VariantsManager: React.FC<VariantsManagerProps> = ({
  basePrice,
  baseSku = 'PROD',
  variants,
  onChange
}) => {
  const [hasVariants, setHasVariants] = useState(variants.length > 0);
  const [option1Name, setOption1Name] = useState('Size');
  const [option1Values, setOption1Values] = useState('S, M, L, XL');
  const [option2Name, setOption2Name] = useState('Color');
  const [option2Values, setOption2Values] = useState('Black, Navy');

  // Generate matrix combinations
  const generateMatrix = () => {
    const vals1 = option1Values.split(',').map(s => s.trim()).filter(Boolean);
    const vals2 = option2Values.split(',').map(s => s.trim()).filter(Boolean);

    if (vals1.length === 0) return;

    const newVariants: ListingVariant[] = [];

    if (vals2.length > 0) {
      vals1.forEach(v1 => {
        vals2.forEach(v2 => {
          newVariants.push({
            option1_name: option1Name,
            option1_value: v1,
            option2_name: option2Name,
            option2_value: v2,
            price: basePrice || 0,
            compare_at_price: null,
            cost_per_item: null,
            sku: `${baseSku || 'SKU'}-${v1.substring(0, 3).toUpperCase()}-${v2.substring(0, 3).toUpperCase()}`,
            barcode: '',
            inventory_quantity: 10
          });
        });
      });
    } else {
      vals1.forEach(v1 => {
        newVariants.push({
          option1_name: option1Name,
          option1_value: v1,
          price: basePrice || 0,
          compare_at_price: null,
          cost_per_item: null,
          sku: `${baseSku || 'SKU'}-${v1.substring(0, 3).toUpperCase()}`,
          barcode: '',
          inventory_quantity: 10
        });
      });
    }

    setHasVariants(true);
    onChange(newVariants);
  };

  const updateVariant = (index: number, field: keyof ListingVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
    if (updated.length === 0) setHasVariants(false);
  };

  const addManualVariant = () => {
    onChange([
      ...variants,
      {
        option1_name: 'Option',
        option1_value: `Variant ${variants.length + 1}`,
        price: basePrice || 0,
        sku: `${baseSku}-${variants.length + 1}`,
        inventory_quantity: 0
      }
    ]);
  };

  const applyBulkPrice = (price: number) => {
    const updated = variants.map(v => ({ ...v, price }));
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      {/* Quick Matrix Generator Accordion */}
      <div className="p-4 rounded-xl bg-[#030712] border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Options & Matrix Generator</h4>
          </div>
          <button
            type="button"
            onClick={generateMatrix}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Combinations
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Option 1 (e.g., Size)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={option1Name}
                onChange={(e) => setOption1Name(e.target.value)}
                placeholder="Name (Size)"
                className="w-1/3 px-2.5 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-white"
              />
              <input
                type="text"
                value={option1Values}
                onChange={(e) => setOption1Values(e.target.value)}
                placeholder="Values (comma-separated: S, M, L)"
                className="w-2/3 px-2.5 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Option 2 (e.g., Color)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={option2Name}
                onChange={(e) => setOption2Name(e.target.value)}
                placeholder="Name (Color)"
                className="w-1/3 px-2.5 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-white"
              />
              <input
                type="text"
                value={option2Values}
                onChange={(e) => setOption2Values(e.target.value)}
                placeholder="Values (comma-separated: Black, Blue)"
                className="w-2/3 px-2.5 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Variants List Table */}
      {variants.length > 0 ? (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#09090b]">
          <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300">
              Total Variants: <span className="text-indigo-400">{variants.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyBulkPrice(Number(basePrice) || 0)}
                className="text-[11px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-zinc-300 border border-white/5 cursor-pointer"
              >
                Sync Base Price (${basePrice || 0})
              </button>
              <button
                type="button"
                onClick={addManualVariant}
                className="text-[11px] px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 rounded border border-indigo-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Variant
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#030712] text-zinc-400 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Variant</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Price ($)</th>
                  <th className="py-2.5 px-3">Compare At ($)</th>
                  <th className="py-2.5 px-3">Cost ($)</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {variants.map((v, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-medium text-white">
                      {v.option1_value} {v.option2_value ? `/ ${v.option2_value}` : ''}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={v.sku || ''}
                        onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                        className="w-24 px-1.5 py-1 bg-black/40 border border-white/5 rounded text-zinc-200"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => updateVariant(i, 'price', e.target.value)}
                        className="w-20 px-1.5 py-1 bg-black/40 border border-white/5 rounded text-emerald-400 font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={v.compare_at_price || ''}
                        placeholder="--"
                        onChange={(e) => updateVariant(i, 'compare_at_price', e.target.value)}
                        className="w-16 px-1.5 py-1 bg-black/40 border border-white/5 rounded text-zinc-400 font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={v.cost_per_item || ''}
                        placeholder="--"
                        onChange={(e) => updateVariant(i, 'cost_per_item', e.target.value)}
                        className="w-16 px-1.5 py-1 bg-black/40 border border-white/5 rounded text-zinc-400 font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={v.inventory_quantity}
                        onChange={(e) => updateVariant(i, 'inventory_quantity', e.target.value)}
                        className="w-14 px-1.5 py-1 bg-black/40 border border-white/5 rounded text-zinc-200"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="p-1 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-6 border border-white/5 rounded-xl bg-[#030712] text-center">
          <p className="text-xs text-zinc-400">
            No variants created. This product will be listed as a single standard item.
          </p>
          <button
            type="button"
            onClick={generateMatrix}
            className="mt-3 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            + Create Variant Options (Size, Color, etc.)
          </button>
        </div>
      )}
    </div>
  );
};
