# NEXORA AI - Architecture & System Design

## 1. System Philosophy
NEXORA AI decouples model consumption from platform hosting. By supporting both Puter's user-pays gateway and user-managed API keys (BYOK), the platform delivers zero-inference-liability operation for the platform owner while giving users unified access to best-in-class models.

```
                      +------------------------------------------+
                      |         NEXORA Client (React/Vite)       |
                      |  - Chat UI / Project Workspaces          |
                      |  - Model Selector / Comparison Grid      |
                      |  - Puter.js SDK (Client-Side Direct)     |
                      +--------------------+---------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
    [Puter User-Pays Gateway]                     [NEXORA Backend API Router]
    - Authenticates Puter User                    - Auth & Session Guard (scrypt)
    - Consumes Puter Quota                        - Encrypted Key Store (AES-256-GCM)
    - Direct Streaming to Client                  - BYOK Provider Adapters
                                                  - Conversation & Project DB
                                                  - File Parser & Text Extractor
                                                                   |
                                          +------------------------+-----------------------+
                                          |           |            |           |           |
                                          v           v            v           v           v
                                     OpenRouter     OpenAI     Anthropic     Gemini    Groq/DeepSeek
```

---

## 2. Component Design

### 2.1 Provider Router & Adapters
Each external AI provider is abstracted through the `BaseProviderAdapter` interface:
- `id`: Unique identifier (e.g., `openai`, `openrouter`, `anthropic`, `gemini`, `groq`, `deepseek`, `mistral`, `puter`).
- `getModels()`: Returns catalog of supported models with context window, pricing tags, and capabilities (`vision`, `reasoning`, `code`).
- `sendMessage(params, onChunk)`: Normalizes request payloads, token limits, temperature, and streams normalized chunks (`{ text, finishReason, usage }`).
- `testConnection(apiKey)`: Validates credentials against provider status/models endpoint without generating tokens.

### 2.2 Security & Data Isolation
- **Tenant Isolation:** Every SQL query querying conversations, messages, files, or keys filters strictly by `user_id` extracted from authenticated session cookies.
- **BYOK Encryption:** API keys are never stored in plain text. Persisted keys are encrypted with `aes-256-gcm` using a server-side encryption key derived from `ENCRYPTION_KEY`.
- **Session-Only Keys:** Users can opt to retain keys purely in client/session memory, transmitting them in ephemeral headers per request.
- **Redaction:** Server logging filters out all `Authorization`, `x-api-key`, and bearer tokens. Error responses sanitize provider error strings to prevent credential leakage.

---

## 3. Database Schema (SQLite WAL / Postgres Compatible)
- `users`: `id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`
- `sessions`: `id`, `user_id`, `expires_at`, `created_at`, `user_agent`, `ip_hash`
- `conversations`: `id`, `user_id`, `project_id`, `title`, `model_id`, `provider_id`, `pinned`, `created_at`, `updated_at`
- `messages`: `id`, `conversation_id`, `role`, `content`, `model_id`, `provider_id`, `tokens_in`, `tokens_out`, `duration_ms`, `error`, `created_at`
- `projects`: `id`, `user_id`, `name`, `description`, `system_instructions`, `created_at`, `updated_at`
- `project_files`: `id`, `project_id`, `user_id`, `filename`, `file_type`, `file_size`, `content_text`, `created_at`
- `provider_keys`: `id`, `user_id`, `provider_id`, `encrypted_key`, `iv`, `auth_tag`, `updated_at`
- `provider_usage`: `id`, `user_id`, `provider_id`, `model_id`, `tokens_in`, `tokens_out`, `estimated_cost`, `created_at`
- `model_favorites`: `id`, `user_id`, `model_id`, `provider_id`, `created_at`
- `audit_events`: `id`, `user_id`, `action`, `ip_hash`, `created_at`
