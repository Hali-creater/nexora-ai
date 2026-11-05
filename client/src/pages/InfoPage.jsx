import React from 'react';
import { ArrowLeft, Cpu, Key, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Logo';

export function InfoPage({ pageType, onBack, onStartChat }) {
  const pages = {
    features: {
      title: 'Platform Features & Capabilities',
      subtitle: 'Engineered for developers, quant traders, and power users.',
      items: [
        {
          title: 'Unified ChatGPT/Claude Interface',
          desc: 'Seamless streaming, markdown rendering, syntax highlighting for 50+ languages, math equations (KaTeX), message branching, and editing.'
        },
        {
          title: 'AETHER-HERMES Quantitative Lab',
          desc: 'Seeded with production-grade starter system instructions for Python and MetaTrader 5 (MT5) MQL5 algorithmic trading strategy development, order flow, delta, and risk engineering.'
        },
        {
          title: 'Drag-and-Drop File Inspection',
          desc: 'Upload Python (.py), MQL5 (.mq5/.mqh), CSV, JSON, logs, and PDFs. Inspected client-side and sandboxed safely without server-side code execution.'
        },
        {
          title: 'Side-by-Side Model Benchmarking',
          desc: 'Run concurrent prompts against two frontier models simultaneously to benchmark token output speed, latency, and code accuracy.'
        }
      ]
    },
    access: {
      title: 'AI Access Options Explained',
      subtitle: 'Two genuine connection models designed for complete billing autonomy.',
      items: [
        {
          title: 'Option A: Puter AI Gateway (User-Pays)',
          desc: 'Authenticate using Puter.com official SDK. Requests route to frontier models (Claude 3.7 Sonnet, GPT-4o, DeepSeek R1) and are billed directly against your personal Puter account credits. NEXORA charges no inference fee.'
        },
        {
          title: 'Option B: Bring Your Own API Key (BYOK)',
          desc: 'Connect your personal keys for OpenRouter, OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, or Mistral. Keys can be kept session-only or stored encrypted with AES-256-GCM. Inferences are paid directly to your API provider.'
        }
      ]
    },
    models: {
      title: 'Supported AI Frontier Models',
      subtitle: 'Explore the full spectrum of supported models across both access modes.',
      items: [
        {
          title: 'Anthropic Claude 3.7 Sonnet & 3.5 Haiku',
          desc: 'State-of-the-art coding, reasoning, and document analysis with up to 200k token context windows.'
        },
        {
          title: 'OpenAI GPT-4o, GPT-4o-mini & o3-mini',
          desc: 'Flagship multimodal vision and advanced STEM reasoning models.'
        },
        {
          title: 'DeepSeek R1 & DeepSeek V3',
          desc: 'Ultra-efficient open reasoning and general coding powerhouses.'
        },
        {
          title: 'Google Gemini 2.0 Flash & 1.5 Pro',
          desc: 'Massive 1M+ context length for deep repository analysis and multimodal vision.'
        },
        {
          title: 'Groq LPUs & Mistral Codestral',
          desc: 'Sub-second real-time token generation for fast coding iterations and quick unit test generations.'
        }
      ]
    },
    pricing: {
      title: 'Pricing & Transparent Billing Structure',
      subtitle: 'NEXORA AI operates on a transparent, zero-markup model.',
      items: [
        {
          title: 'No Platform AI Inference Markup',
          desc: 'NEXORA AI does not add hidden profit margins or tokens fees on top of model calls.'
        },
        {
          title: 'Puter Billing Model',
          desc: 'Puter usage is subject to Puter.com pricing and quota policies. Users are responsible for maintaining their Puter accounts.'
        },
        {
          title: 'Direct BYOK Provider Billing',
          desc: 'You pay OpenRouter, OpenAI, Anthropic, or Google directly at standard token rates.'
        }
      ]
    },
    about: {
      title: 'About NEXORA AI',
      subtitle: 'The intelligence workspace created for developers who demand control over their AI infrastructure.',
      items: [
        {
          title: 'Our Mission',
          desc: 'To provide a pristine, distraction-free environment where software architects and quant traders can orchestrate multiple AI models without vendor lock-in.'
        },
        {
          title: 'Security-First Architecture',
          desc: 'We believe API keys and proprietary trading strategies should belong solely to you. Everything is isolated by tenant and encrypted at rest.'
        }
      ]
    },
    contact: {
      title: 'Contact & Developer Support',
      subtitle: 'Questions, enterprise queries, or bug reports.',
      items: [
        {
          title: 'GitHub & Community',
          desc: 'Report issues or contribute feature requests directly through our official GitHub repository.'
        },
        {
          title: 'Direct Inquiries',
          desc: 'Reach our engineering team at support@nexora.ai for architectural consultations or deployment questions.'
        }
      ]
    }
  };

  const active = pages[pageType] || pages.features;

  return (
    <div className="min-h-screen bg-nexora-darkest text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between border-b border-nexora-border/60 pb-4">
          <Logo textClassName="text-xl font-bold" />
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs text-nexora-muted hover:text-white flex items-center gap-1.5 p-2 rounded-lg bg-nexora-card border border-nexora-border transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <button
              onClick={onStartChat}
              className="px-4 py-2 rounded-lg bg-nexora-accent hover:bg-blue-600 text-white text-xs font-semibold"
            >
              Start Chatting
            </button>
          </div>
        </div>

        <div className="bg-nexora-dark border border-nexora-border rounded-2xl p-8 space-y-8 shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{active.title}</h1>
            <p className="text-xs sm:text-sm text-nexora-muted mt-1">{active.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {active.items.map((item, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-nexora-card border border-nexora-border space-y-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-nexora-cyan" />
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-nexora-muted leading-relaxed pl-6">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
