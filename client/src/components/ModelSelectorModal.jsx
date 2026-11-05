import React, { useState } from 'react';
import { Search, Sparkles, Zap, Brain, Code, Eye, ExternalLink, Check } from 'lucide-react';

export function ModelSelectorModal({ isOpen, onClose, models, selectedModel, onSelectModel, accessMethod }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, vision, reasoning, code

  if (!isOpen) return null;

  const filtered = models.filter(m => {
    // Filter by active access method (puter vs byok)
    if (accessMethod && m.accessMethod !== accessMethod) return false;

    // Search query
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.provider.toLowerCase().includes(search.toLowerCase()) ||
                        m.id.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    // Category filter
    if (categoryFilter === 'vision' && !m.supportsVision) return false;
    if (categoryFilter === 'reasoning' && !m.supportsReasoning) return false;
    if (categoryFilter === 'code' && !m.supportsCode) return false;

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-nexora-dark border border-nexora-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-nexora-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-nexora-cyan" />
              Select AI Model
            </h3>
            <p className="text-xs text-nexora-muted mt-1">
              Currently routing via <span className="text-white font-medium capitalize">{accessMethod === 'puter' ? 'Puter AI Gateway (User-Pays)' : 'BYOK (Direct Provider)'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-nexora-muted hover:text-white p-1.5 rounded-lg hover:bg-nexora-card transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-nexora-border/60 bg-nexora-darkest/40 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-nexora-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by model or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-nexora-card border border-nexora-border rounded-lg text-sm text-white placeholder-nexora-muted focus:outline-none focus:border-nexora-accent"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'code', label: 'Coding', icon: Code },
              { id: 'reasoning', label: 'Reasoning', icon: Brain },
              { id: 'vision', label: 'Vision', icon: Eye }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  categoryFilter === tab.id
                    ? 'bg-nexora-accent text-white'
                    : 'bg-nexora-card text-nexora-muted hover:text-white border border-nexora-border'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Models List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-nexora-muted text-sm">
              No models match your search criteria.
            </div>
          ) : (
            filtered.map(model => {
              const isSelected = selectedModel?.id === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-nexora-accent/10 border-nexora-accent/50 shadow-sm'
                      : 'bg-nexora-card/60 border-nexora-border hover:border-nexora-accent/40 hover:bg-nexora-card'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{model.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-nexora-dark border border-nexora-border text-nexora-cyan uppercase">
                        {model.provider}
                      </span>
                      {isSelected && (
                        <span className="flex items-center text-xs text-nexora-cyan gap-0.5 font-medium">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-nexora-muted">
                      Context: <span className="text-slate-300 font-mono">{(model.contextLength / 1000).toFixed(0)}k tokens</span> &bull; {model.pricingNote}
                    </p>
                    <div className="flex gap-2 pt-1">
                      {model.supportsVision && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> Vision
                        </span>
                      )}
                      {model.supportsReasoning && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <Brain className="w-2.5 h-2.5" /> Reasoning
                        </span>
                      )}
                      {model.supportsCode && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Code className="w-2.5 h-2.5" /> Code
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Manual Model ID fallback */}
        <div className="p-4 border-t border-nexora-border bg-nexora-darkest/70 flex items-center justify-between text-xs text-nexora-muted">
          <span>Need a custom fine-tune or unlisted model ID?</span>
          <button
            onClick={() => {
              const customId = prompt('Enter exact provider model ID (e.g. meta-llama/llama-3.1-405b):');
              if (customId && customId.trim()) {
                onSelectModel({
                  id: customId.trim(),
                  provider: accessMethod === 'puter' ? 'puter' : 'openrouter',
                  name: `Custom (${customId.trim()})`,
                  contextLength: 128000,
                  supportsStreaming: true,
                  accessMethod
                });
                onClose();
              }
            }}
            className="text-nexora-accent hover:underline flex items-center gap-1"
          >
            Custom Model ID <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
