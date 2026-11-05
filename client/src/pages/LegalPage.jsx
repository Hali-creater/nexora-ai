import React from 'react';
import { ArrowLeft, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Logo';

export function LegalPage({ pageType, onBack }) {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'February 2025',
      body: `
### 1. Overview
NEXORA AI ("Platform", "we", "us") values your privacy. This Privacy Policy details our data practices regarding account information, conversation retention, and API credential management.

### 2. Information We Collect
- **Account Data:** When registering, we collect your name and email address. Passwords are salted and hashed using scrypt; we never store plain-text passwords.
- **Provider API Keys (BYOK):** Keys saved on the platform are encrypted using AES-256-GCM. Alternatively, you may choose session-only keys which remain in client memory and are never persisted to our database.
- **Conversations & Workspaces:** Chats and uploaded code files are stored under your isolated user account to enable cross-session persistence.

### 3. Puter Integration & Direct Gateway
When using Puter AI access, requests route through Puter's official SDK directly to Puter's AI Gateway. Puter user credentials are managed directly by Puter.com and are never saved to NEXORA's database.

### 4. Third-Party AI Providers
When using BYOK mode, prompt contents are transmitted directly to the respective model provider (OpenAI, Anthropic, Google, OpenRouter, Groq, DeepSeek, Mistral). Each provider operates under their own privacy policy regarding prompt logging and model training.

### 5. Data Deletion
You can delete individual conversations, files, or your entire NEXORA account at any time through Account Settings. Deletion is instantaneous and permanent across all related database records.
      `
    },
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'February 2025',
      body: `
### 1. Acceptance of Terms
By accessing or using NEXORA AI, you agree to be bound by these Terms of Service. If you do not agree, do not use the application.

### 2. Dual Access AI Model
- **Puter User-Pays:** Puter access is billed directly to your personal Puter account. NEXORA does not provide free unlimited AI inference and is not liable for Puter service quotas or billing disputes.
- **Bring Your Own Key (BYOK):** You are responsible for any charges incurred with your selected third-party API providers. NEXORA charges zero platform inference markup for BYOK usage.

### 3. Prohibited Uses
You agree not to use NEXORA AI to generate unlawful content, conduct unauthorized penetration testing or denial-of-service attacks, reverse-engineer other users' workspaces, or bypass provider safety guards.

### 4. Disclaimer of Warranties
NEXORA AI is provided "as is" without warranty of any kind. AI models may produce hallucinations or inaccuracies. We disclaim all liability for trading decisions or code deployments made using AI outputs.
      `
    },
    cookies: {
      title: 'Cookie & Tracking Policy',
      lastUpdated: 'February 2025',
      body: `
### 1. Essential Cookies Only
NEXORA AI uses only strictly necessary HTTP-only authentication cookies (\`nexora_session\`) to securely maintain your logged-in state across browser sessions.

### 2. Advertising & Analytics
- We do not run third-party tracker cookies inside private chat workspaces or project contexts.
- Future advertising modules (Google AdSense / Monetag) will be strictly confined to public educational and marketing pages with explicit user consent toggles.
      `
    },
    billing: {
      title: 'AI Usage & Billing Disclosures',
      lastUpdated: 'February 2025',
      body: `
### Transparent Billing Disclosures
NEXORA AI does not subsidize public AI consumption or promise unlimited free frontier models.

1. **Option A (Puter):** Inference is executed against your Puter.com allowance according to Puter's official rates. NEXORA does not bill you for Puter models.
2. **Option B (BYOK):** Inferences are billed directly by your API provider (OpenAI, OpenRouter, Anthropic, Gemini, Groq, DeepSeek, Mistral) based on token usage.
      `
    }
  };

  const activeContent = content[pageType] || content.privacy;

  return (
    <div className="min-h-screen bg-nexora-darkest text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between border-b border-nexora-border/60 pb-4">
          <Logo textClassName="text-xl font-bold" />
          <button
            onClick={onBack}
            className="text-xs text-nexora-muted hover:text-white flex items-center gap-1.5 p-2 rounded-lg bg-nexora-card border border-nexora-border transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to NEXORA
          </button>
        </div>

        <div className="bg-nexora-dark border border-nexora-border rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="border-b border-nexora-border pb-4">
            <h1 className="text-2xl font-bold text-white">{activeContent.title}</h1>
            <p className="text-xs text-nexora-muted mt-1">Last Updated: {activeContent.lastUpdated}</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-4 text-slate-300 leading-relaxed whitespace-pre-line font-sans">
            {activeContent.body}
          </div>
        </div>
      </div>
    </div>
  );
}
