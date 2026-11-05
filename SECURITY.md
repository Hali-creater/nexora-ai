# NEXORA AI - Security Policy & Vulnerability Mitigation

## 1. Core Security Guarantees
- **No Stored Plaintext API Keys:** Keys saved to the database use authenticated AES-256-GCM with unique 12-byte initialization vectors (IV) and 16-byte authentication tags.
- **Session-Only Option:** Users who do not want server persistence can supply keys per session in client memory.
- **Puter SDK Direct Authentication:** NEXORA never intercepts or stores Puter user passwords or account credentials. Puter auth tokens reside exclusively within the user's browser runtime and Puter's official SDK.
- **Strict Tenant Separation:** Cross-user data access is strictly prevented by enforcing `user_id` ownership on every route accessing conversations, messages, files, and project workspaces.
- **Untrusted File Handling:** Uploaded source files (Python, MQL5, CSV, PDF, JSON) are parsed into safe text buffers for AI context injection. Uploaded code is **never** executed on the server.
- **Safe Prompt Injection Disclaimers:** File contents injected into system or user prompts are framed in clear delimiter blocks with sanitization to mitigate prompt injection hijacking.

## 2. Threat Model & Mitigations

| Threat | Risk Level | Mitigation in NEXORA AI |
|---|---|---|
| Plaintext Key Leakage | Critical | AES-256-GCM encryption at rest; secrets scrubbed from server logs and error stack traces. |
| Cross-Tenant Data Access | Critical | Foreign key ownership enforcement in all query builders; security tests for IDOR. |
| Insecure Session Hijacking | High | HTTP-only, SameSite=Strict cookies; secure cookie flags in production; session expiration. |
| Server-Side Code Execution | Critical | Sandboxed static file parsing only. No `eval()`, `exec()`, or child process invocation on user files. |
| Denial of Service / Abuse | Medium | Strict rate limiting on auth endpoints (5 req/min) and AI proxy endpoints (60 req/min). Max payload sizes enforced. |
| SSRF via Provider Webhooks | High | Provider endpoints whitelist restricted to verified provider APIs. No arbitrary client-supplied URLs. |
| Malicious Puter Subsidization | Critical | NEXORA client initiates Puter AI calls using client-side Puter SDK binding to user's active Puter session. Platform server holds zero master Puter keys. |

## 3. Reporting a Security Issue
If you discover a security vulnerability within NEXORA AI, please submit a responsible disclosure report to `security@nexora.ai` (or via GitHub Security Advisories).
