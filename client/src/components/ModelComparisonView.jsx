import React, { useState } from 'react';
import { Play, Copy, Check, Clock, Zap, Columns } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ModelComparisonView({ models, onClose }) {
  const [prompt, setPrompt] = useState('Compare the time complexity and memory overhead of Red-Black Trees vs AVL Trees in high-frequency trading order books.');
  const [selectedModelA, setSelectedModelA] = useState(models[0]?.id || 'gpt-4o');
  const [selectedModelB, setSelectedModelB] = useState(models[1]?.id || 'deepseek/deepseek-r1');
  const [loading, setLoading] = useState(false);
  const [resultA, setResultA] = useState({ text: '', duration: 0 });
  const [resultB, setResultB] = useState({ text: '', duration: 0 });
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const runComparison = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResultA({ text: '', duration: 0 });
    setResultB({ text: '', duration: 0 });

    const modelObjA = models.find(m => m.id === selectedModelA);
    const modelObjB = models.find(m => m.id === selectedModelB);

    const executeModel = async (modelObj, setResult) => {
      const startTime = Date.now();
      try {
        let full = '';
        if (modelObj?.accessMethod === 'puter' && window.puter?.ai?.chat) {
          const resp = await window.puter.ai.chat(prompt, { model: modelObj.id, stream: true });
          for await (const part of resp) {
            full += part?.text || '';
            setResult({ text: full, duration: Date.now() - startTime });
          }
        } else {
          // BYOK stream call
          const res = await fetch('/api/ai/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId: modelObj?.provider || 'openrouter',
              modelId: modelObj?.id,
              messages: [{ role: 'user', content: prompt }]
            }),
            credentials: 'include'
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Request failed');
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';

            for (const l of lines) {
              const t = l.trim();
              if (t.startsWith('data:')) {
                const data = JSON.parse(t.replace('data:', ''));
                if (data.delta) {
                  full += data.delta;
                  setResult({ text: full, duration: Date.now() - startTime });
                }
              }
            }
          }
        }
      } catch (e) {
        setResult({ text: `⚠️ Error executing ${modelObj?.name}: ${e.message}`, duration: Date.now() - startTime });
      }
    };

    await Promise.allSettled([
      executeModel(modelObjA, setResultA),
      executeModel(modelObjB, setResultB)
    ]);

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-nexora-dark border border-nexora-border w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-nexora-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-nexora-violet/10 border border-nexora-violet/30 text-nexora-violet">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Side-by-Side Model Comparison</h3>
              <p className="text-xs text-nexora-muted">Evaluate latency, formatting, and reasoning across models in parallel.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-nexora-muted hover:text-white p-1.5 rounded-lg hover:bg-nexora-card">✕</button>
        </div>

        {/* Prompt Input & Model Selectors */}
        <div className="p-4 bg-nexora-darkest/60 border-b border-nexora-border space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt to evaluate across both models..."
                className="w-full px-3.5 py-2.5 bg-nexora-card border border-nexora-border rounded-xl text-sm text-white focus:outline-none focus:border-nexora-accent"
              />
            </div>
            <button
              onClick={runComparison}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nexora-accent to-nexora-violet hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-nexora-accent/20"
            >
              <Play className="w-4 h-4 fill-white" />
              {loading ? 'Comparing...' : 'Run Benchmark'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-nexora-muted font-medium">Model A:</span>
              <select
                value={selectedModelA}
                onChange={(e) => setSelectedModelA(e.target.value)}
                className="bg-nexora-card border border-nexora-border rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-nexora-accent flex-1"
              >
                {models.map(m => (
                  <option key={`a-${m.id}`} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-nexora-muted font-medium">Model B:</span>
              <select
                value={selectedModelB}
                onChange={(e) => setSelectedModelB(e.target.value)}
                className="bg-nexora-card border border-nexora-border rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-nexora-accent flex-1"
              >
                {models.map(m => (
                  <option key={`b-${m.id}`} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-nexora-border overflow-hidden">
          {/* Column A */}
          <div className="flex flex-col h-full overflow-hidden bg-nexora-dark/40">
            <div className="p-3 border-b border-nexora-border flex items-center justify-between bg-nexora-card/30">
              <span className="text-xs font-semibold text-white truncate">{selectedModelA}</span>
              <div className="flex items-center gap-2">
                {resultA.duration > 0 && (
                  <span className="text-[10px] text-nexora-muted font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> {resultA.duration}ms
                  </span>
                )}
                {resultA.text && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resultA.text);
                      setCopiedA(true);
                      setTimeout(() => setCopiedA(false), 2000);
                    }}
                    className="p-1 rounded text-nexora-muted hover:text-white"
                  >
                    {copiedA ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 prose prose-invert prose-sm max-w-none text-xs">
              {resultA.text ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{resultA.text}</ReactMarkdown>
              ) : (
                <div className="h-full flex items-center justify-center text-nexora-muted text-xs">
                  {loading ? 'Awaiting response...' : 'Run comparison to benchmark Model A'}
                </div>
              )}
            </div>
          </div>

          {/* Column B */}
          <div className="flex flex-col h-full overflow-hidden bg-nexora-dark/40">
            <div className="p-3 border-b border-nexora-border flex items-center justify-between bg-nexora-card/30">
              <span className="text-xs font-semibold text-white truncate">{selectedModelB}</span>
              <div className="flex items-center gap-2">
                {resultB.duration > 0 && (
                  <span className="text-[10px] text-nexora-muted font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> {resultB.duration}ms
                  </span>
                )}
                {resultB.text && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resultB.text);
                      setCopiedB(true);
                      setTimeout(() => setCopiedB(false), 2000);
                    }}
                    className="p-1 rounded text-nexora-muted hover:text-white"
                  >
                    {copiedB ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 prose prose-invert prose-sm max-w-none text-xs">
              {resultB.text ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{resultB.text}</ReactMarkdown>
              ) : (
                <div className="h-full flex items-center justify-center text-nexora-muted text-xs">
                  {loading ? 'Awaiting response...' : 'Run comparison to benchmark Model B'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
