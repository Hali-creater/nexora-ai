import React, { useState, useEffect } from 'react';
import { Key, Shield, Check, Trash2, ExternalLink, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export function ProviderKeysModal({ isOpen, onClose }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeInputProvider, setActiveInputProvider] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/keys', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProviders();
      setStatusMsg(null);
    }
  }, [isOpen]);

  const handleSaveKey = async (providerId) => {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      // Step 1: Validate key live with provider
      const valRes = await fetch('/api/ai/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey: apiKeyInput.trim() }),
        credentials: 'include'
      });
      const valData = await valRes.json();

      if (!valRes.ok || !valData.valid) {
        throw new Error(valData.error || 'Provider rejected this API key');
      }

      // Step 2: Encrypt and persist
      const saveRes = await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey: apiKeyInput.trim() }),
        credentials: 'include'
      });

      if (!saveRes.ok) throw new Error('Failed to encrypt and save key');

      setStatusMsg({ type: 'success', text: `Key verified & AES-256-GCM encrypted successfully!` });
      setApiKeyInput('');
      setActiveInputProvider(null);
      fetchProviders();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (providerId) => {
    if (!confirm(`Are you sure you want to delete your ${providerId} key?`)) return;
    try {
      await fetch(`/api/keys/${providerId}`, { method: 'DELETE', credentials: 'include' });
      fetchProviders();
      setStatusMsg({ type: 'success', text: `Key deleted.` });
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Failed to delete key.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-nexora-dark border border-nexora-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-nexora-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-nexora-accent/10 border border-nexora-accent/30 text-nexora-accent">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Bring Your Own Key (BYOK)</h3>
              <p className="text-xs text-nexora-muted">
                Keys are authenticated, encrypted using AES-256-GCM at rest, and never exposed to other tenants.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-nexora-muted hover:text-white p-1.5 rounded-lg hover:bg-nexora-card">✕</button>
        </div>

        {/* Security Notice */}
        <div className="px-5 py-3 bg-nexora-card/40 border-b border-nexora-border flex items-center gap-3 text-xs text-nexora-muted">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            NEXORA charges zero platform markup on BYOK inference. API usage is billed directly to your personal provider accounts.
          </span>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`p-3 mx-5 mt-4 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {statusMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {statusMsg.text}
          </div>
        )}

        {/* Providers List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {providers.map(p => {
            const isEditing = activeInputProvider === p.id;
            return (
              <div key={p.id} className="p-4 rounded-xl bg-nexora-card border border-nexora-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-white text-sm">{p.name}</span>
                    {p.isConfigured ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 text-[10px]">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={p.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-nexora-muted hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Get Key <ExternalLink className="w-3 h-3" />
                    </a>
                    {p.isConfigured ? (
                      <button
                        onClick={() => handleDeleteKey(p.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveInputProvider(isEditing ? null : p.id);
                          setApiKeyInput('');
                        }}
                        className="px-3 py-1 rounded-lg bg-nexora-accent/20 hover:bg-nexora-accent/30 text-nexora-accent text-xs font-medium border border-nexora-accent/30 transition-colors"
                      >
                        {isEditing ? 'Cancel' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Input Section */}
                {isEditing && (
                  <div className="pt-2 border-t border-nexora-border/60 space-y-2">
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={`Paste your ${p.name} API key...`}
                        className="w-full px-3 py-2 pr-10 bg-nexora-dark border border-nexora-border rounded-lg text-xs text-white placeholder-nexora-muted font-mono focus:outline-none focus:border-nexora-accent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-nexora-muted hover:text-white"
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveInputProvider(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-nexora-muted hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={saving || !apiKeyInput.trim()}
                        onClick={() => handleSaveKey(p.id)}
                        className="px-4 py-1.5 rounded-lg bg-nexora-accent hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                      >
                        {saving ? 'Testing & Encrypting...' : 'Save & Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
