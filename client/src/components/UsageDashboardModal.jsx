import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Zap, Clock, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UsageDashboardModal({ isOpen, onClose }) {
  const { puterUser, puterStatus } = useAuth();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ai/usage', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          setUsageData(data);
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-nexora-dark border border-nexora-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-nexora-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-nexora-cyan/10 border border-nexora-cyan/30 text-nexora-cyan">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Usage & Telemetry Dashboard</h3>
              <p className="text-xs text-nexora-muted">
                Transparent telemetry for Puter User-Pays and BYOK inferences.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-nexora-muted hover:text-white p-1.5 rounded-lg hover:bg-nexora-card">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Puter Gateway Status Card */}
          <div className="p-4 rounded-xl bg-nexora-card border border-nexora-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-nexora-cyan uppercase tracking-wider">Puter AI Gateway</span>
                <h4 className="text-sm font-medium text-white mt-1">Official User-Pays AI Billing</h4>
                <p className="text-xs text-nexora-muted mt-0.5">
                  Usage under this access mode consumes your personal Puter account credits and quotas.
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  puterStatus === 'logged_in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {puterStatus === 'logged_in' ? `Connected: ${puterUser?.username || 'Active'}` : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-nexora-card border border-nexora-border">
              <div className="flex items-center gap-2 text-nexora-muted text-xs">
                <Activity className="w-3.5 h-3.5 text-blue-400" /> Requests
              </div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {usageData?.summary?.totalRequests || 0}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-nexora-card border border-nexora-border">
              <div className="flex items-center gap-2 text-nexora-muted text-xs">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Prompt Tokens
              </div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {(usageData?.summary?.totalTokensIn || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-nexora-card border border-nexora-border">
              <div className="flex items-center gap-2 text-nexora-muted text-xs">
                <Database className="w-3.5 h-3.5 text-purple-400" /> Output Tokens
              </div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {(usageData?.summary?.totalTokensOut || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-nexora-card border border-nexora-border">
              <div className="flex items-center gap-2 text-nexora-muted text-xs">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Avg Latency
              </div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {usageData?.summary?.avgDurationMs || 0}ms
              </div>
            </div>
          </div>

          {/* Recent Records Log */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Recent Inferences</h4>
            <div className="rounded-xl border border-nexora-border overflow-hidden bg-nexora-card/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-nexora-dark border-b border-nexora-border text-nexora-muted font-mono">
                    <tr>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Model</th>
                      <th className="p-3">In / Out Tokens</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexora-border/40 font-mono">
                    {usageData?.records?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-nexora-muted font-sans">
                          No inferences recorded yet.
                        </td>
                      </tr>
                    ) : (
                      usageData?.records?.slice(0, 10).map((r, i) => (
                        <tr key={i} className="hover:bg-nexora-card">
                          <td className="p-3 text-white capitalize">{r.provider_id}</td>
                          <td className="p-3 text-slate-300">{r.model_id}</td>
                          <td className="p-3 text-nexora-muted">{r.tokens_in} / {r.tokens_out}</td>
                          <td className="p-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              r.is_estimated ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {r.is_estimated ? 'Estimated' : 'Provider Reported'}
                            </span>
                          </td>
                          <td className="p-3 text-nexora-muted">{r.duration_ms}ms</td>
                          <td className="p-3 text-nexora-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
