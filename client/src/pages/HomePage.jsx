import React from 'react';
import { Sparkles, Zap, Shield, Key, Bot, Cpu, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';

export function HomePage({ onStartChat, onOpenLegal, onNavigate }) {
  return (
    <div className="min-h-screen bg-nexora-darkest text-slate-100 flex flex-col selection:bg-nexora-accent/30 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-nexora-border/60 bg-nexora-dark/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo textClassName="text-xl font-bold" />
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-nexora-muted">
            <button onClick={() => onNavigate('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => onNavigate('access')} className="hover:text-white transition-colors">AI Access Options</button>
            <button onClick={() => onNavigate('models')} className="hover:text-white transition-colors">Supported Models</button>
            <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">Billing Explanation</button>
            <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">About</button>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={onStartChat}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-nexora-accent via-indigo-600 to-nexora-cyan hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-nexora-accent/20 flex items-center gap-1.5 transition-all"
            >
              Start Chatting <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-nexora-accent/20 via-nexora-violet/15 to-transparent blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nexora-card border border-nexora-border text-xs text-nexora-cyan font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            The Unified Multi-Provider AI Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your Intelligence. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
              Your Workspace.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-nexora-muted max-w-2xl mx-auto leading-relaxed">
            Access Claude 3.7, GPT-4o, DeepSeek R1, Gemini 2.0 and open models through a single, elegant ChatGPT-style workspace. Connect using Puter's official user-pays AI gateway or bring your private API keys with zero platform inference markup.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartChat}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-nexora-accent to-nexora-violet hover:opacity-95 text-white text-sm font-semibold shadow-xl shadow-nexora-accent/25 flex items-center justify-center gap-2 transition-all"
            >
              Launch NEXORA Chat <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('access')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-nexora-card border border-nexora-border hover:bg-nexora-border/50 text-slate-200 text-sm font-medium transition-all"
            >
              Explore Access Modes
            </button>
          </div>
        </div>
      </section>

      {/* Dual Access Architecture Cards */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Two Genuine Ways to Access AI</h2>
          <p className="text-xs sm:text-sm text-nexora-muted mt-2">
            No synthetic limitations. Completely transparent billing arrangements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Puter */}
          <div className="p-8 rounded-2xl bg-nexora-card/70 border border-nexora-border hover:border-nexora-cyan/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-3 w-fit rounded-xl bg-nexora-cyan/10 border border-nexora-cyan/30 text-nexora-cyan">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-nexora-cyan">Option A</span>
              <h3 className="text-xl font-bold text-white">Puter User-Pays Gateway</h3>
              <p className="text-xs sm:text-sm text-nexora-muted leading-relaxed">
                Connect via Puter's official SDK. Usage is charged transparently against your personal Puter account credits and quotas.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Official Puter user-pays billing integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Zero developer account subsidization</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Claude 3.7, GPT-4o & DeepSeek access</li>
              </ul>
            </div>
          </div>

          {/* Option B: BYOK */}
          <div className="p-8 rounded-2xl bg-nexora-card/70 border border-nexora-border hover:border-nexora-accent/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-3 w-fit rounded-xl bg-nexora-accent/10 border border-nexora-accent/30 text-nexora-accent">
                <Key className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-nexora-accent">Option B</span>
              <h3 className="text-xl font-bold text-white">Bring Your Own Key (BYOK)</h3>
              <p className="text-xs sm:text-sm text-nexora-muted leading-relaxed">
                Supply your own API credentials for OpenRouter, OpenAI, Anthropic, Gemini, Groq, DeepSeek, or Mistral.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Zero inference markup from NEXORA</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> AES-256-GCM encrypted persistence or session-only</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Pay providers directly at cost</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Features Highlight */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full border-t border-nexora-border/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-nexora-dark border border-nexora-border space-y-3">
            <Layers className="w-5 h-5 text-nexora-violet" />
            <h4 className="text-base font-semibold text-white">Project Workspaces</h4>
            <p className="text-xs text-nexora-muted leading-relaxed">
              Dedicated project sandboxes with custom system prompts, file association, and conversation grouping. Includes the <strong>AETHER-HERMES LAB</strong> for quantitative trading engineering.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-nexora-dark border border-nexora-border space-y-3">
            <Bot className="w-5 h-5 text-nexora-cyan" />
            <h4 className="text-base font-semibold text-white">Multi-Model Comparison</h4>
            <p className="text-xs text-nexora-muted leading-relaxed">
              Submit prompt benchmarks across two AI models concurrently. Inspect side-by-side latency, token usage, and response fidelity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-nexora-dark border border-nexora-border space-y-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-semibold text-white">Tenant & Key Isolation</h4>
            <p className="text-xs text-nexora-muted leading-relaxed">
              Scrypt password hashing, session-only or AES-256-GCM BYOK key storage, and strict SQL tenant isolation guarantees.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-nexora-border/60 py-10 px-6 bg-nexora-darkest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-nexora-muted">
          <div className="flex items-center gap-3">
            <Logo textClassName="text-sm font-semibold" className="w-5 h-5" />
            <span>&copy; {new Date().getFullYear()} NEXORA AI. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors">Terms of Service</button>
            <button onClick={() => onOpenLegal('cookies')} className="hover:text-white transition-colors">Cookie Policy</button>
            <button onClick={() => onOpenLegal('billing')} className="hover:text-white transition-colors">Billing Disclosures</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
