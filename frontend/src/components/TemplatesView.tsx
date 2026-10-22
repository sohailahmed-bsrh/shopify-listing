import React, { useState } from 'react';
import { Plus, Trash2, FileText, Check, AlertCircle } from 'lucide-react';
import { ListingTemplate } from '../types';
import { api } from '../services/api';

interface TemplatesViewProps {
  templates: ListingTemplate[];
  onRefresh: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ templates, onRefresh }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [descriptionTemplate, setDescriptionTemplate] = useState('');
  const [defaultVendor, setDefaultVendor] = useState('EMS');
  const [defaultTags, setDefaultTags] = useState('premium, standard');
  const [policySnippet, setPolicySnippet] = useState('Free 30-day returns and 1-year product warranty.');
  const [sizeChartHtml, setSizeChartHtml] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await api.createTemplate({
        name,
        description_template: descriptionTemplate,
        default_vendor: defaultVendor,
        default_tags: defaultTags,
        policy_snippet: policySnippet,
        size_chart_html: sizeChartHtml
      });
      setShowCreate(false);
      setName('');
      setDescriptionTemplate('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Listing Templates</h2>
          <p className="text-xs text-zinc-400">Pre-defined sizing charts, warranty terms, and brand descriptions</p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleSubmit} className="ems-card p-6 border border-white/10 space-y-4 bg-[#09090b]">
          <h3 className="text-sm font-bold text-white">Create New Listing Template</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Template Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Footwear & Shoes Standard"
                className="w-full px-3 py-2 bg-[#030712] border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Default Vendor</label>
              <input
                type="text"
                value={defaultVendor}
                onChange={(e) => setDefaultVendor(e.target.value)}
                placeholder="EMS Originals"
                className="w-full px-3 py-2 bg-[#030712] border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-zinc-400 mb-1">Description Template (HTML allowed)</label>
            <textarea
              rows={4}
              value={descriptionTemplate}
              onChange={(e) => setDescriptionTemplate(e.target.value)}
              placeholder="<h3>Features</h3><ul><li>...</li></ul>"
              className="w-full p-3 bg-[#030712] border border-white/10 rounded-lg text-white font-mono"
            />
          </div>

          <div className="text-xs">
            <label className="block text-zinc-400 mb-1">Default Warranty / Policy Snippet</label>
            <input
              type="text"
              value={policySnippet}
              onChange={(e) => setPolicySnippet(e.target.value)}
              className="w-full px-3 py-2 bg-[#030712] border border-white/10 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Save Template
            </button>
          </div>
        </form>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t.id} className="ems-card p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {t.policy_snippet && (
                <div className="mt-3 p-2.5 rounded-lg bg-[#030712] border border-white/5 text-[11px] text-zinc-400">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider block text-[9px] mb-0.5">Policy:</span>
                  {t.policy_snippet}
                </div>
              )}

              {t.description_template && (
                <div className="mt-3 text-xs text-zinc-400 line-clamp-3 font-mono bg-[#030712] p-2.5 rounded-lg border border-white/5">
                  {t.description_template}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Vendor: {t.default_vendor || 'EMS'}</span>
              <span>Tags: {t.default_tags}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
