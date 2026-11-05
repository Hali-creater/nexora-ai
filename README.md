# NEXORA AI

> **Your Intelligence. Your Workspace.**

NEXORA AI is a professional, unified multi-provider AI chat and developer workspace inspired by modern AI environments. It provides genuine dual-access AI connectivity:
1. **Puter AI Access (User-Pays):** Users authenticate via Puter.com's official SDK and utilize their personal Puter AI allowance. NEXORA does not subsidize or incur inference fees.
2. **Bring Your Own Key (BYOK):** Users connect their private API keys directly (OpenRouter, OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, Mistral) with client-side or AES-256-GCM encrypted persistence. NEXORA charges zero inference markup.

---

## 🌟 Core Features

- **Unified Interface:** Identical ChatGPT/Claude-grade chat interface regardless of access method.
- **Provider Router:** Extensible adapters for OpenRouter, OpenAI, Anthropic Claude, Gemini, Groq, DeepSeek, Mistral, and Puter.
- **Project Workspaces:** Dedicated workspace spaces with custom system instructions, file management, and conversation isolation. Includes the flagship **AETHER-HERMES LAB** for algorithmic trading engineering (Python, MetaTrader 5, MQL5).
- **File Upload & Inspection:** Multi-file drag-and-drop parsing for Python, MQL5, CSV, JSON, PDF, TXT, and Markdown files.
- **Model Comparison:** Side-by-side multi-model inference benchmarking.
- **Usage & Cost Dashboard:** Request logs, token counters, estimated costs, and Puter quota indicators.
- **Secure Authentication & Strict Tenant Isolation:** Scrypt password hashing, secure session management, foreign key user isolation, and secret redaction.
- **Responsive Dark-First Visuals:** Deep charcoal & navy aesthetics with subtle cyan, violet, and electric blue accents.

---

## 🛠️ Architecture Overview

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Markdown & Math formatting (`react-markdown`, `remark-math`, `rehype-katex`), syntax highlighting (`prismjs` / `highlight.js`).
- **Backend:** Node.js, Express, Better-SQLite3 (with WAL mode) / PostgreSQL ready, SSE (Server-Sent Events) for real-time token streaming.
- **Security:** AES-256-GCM encrypted key store at rest, strict rate limiting, CORS controls, HTTP-only cookies, SSRF protections, and strict tenant ownership checks.

---

## 🚀 Quick Start (Local Development)

### 1. Requirements
- Node.js >= 18.x
- npm >= 9.x

### 2. Setup
```bash
# Clone the repository
git clone <repo-url>
cd nexora-ai

# Copy environment variables
cp .env.example .env

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 3. Run Locally
```bash
# Terminal 1: Start backend (runs on http://localhost:5000)
cd server && npm run dev

# Terminal 2: Start frontend (runs on http://localhost:5173)
cd client && npm run dev
```

Visit `http://localhost:5173` in your browser.

For complete architectural specifications, see [ARCHITECTURE.md](ARCHITECTURE.md). For security protocols, see [SECURITY.md](SECURITY.md).
