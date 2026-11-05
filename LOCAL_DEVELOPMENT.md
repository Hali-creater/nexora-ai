# NEXORA AI - Local Development Guide

## Prerequisites
- Node.js 18.x or 20.x+
- npm 9.x+

## Installation

### 1. Environment Configuration
Create a `.env` file in the root or copy from `.env.example`:
```bash
cp .env.example .env
```

Key environment settings:
- `PORT=5000`
- `NODE_ENV=development`
- `ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` (32-byte hex key for AES-256-GCM)
- `SESSION_SECRET=nexora_super_secret_session_key_replace_in_prod`

### 2. Install Dependencies
```bash
# In the root repository directory
npm run install:all
```
*(Or install inside `server` and `client` individually)*

### 3. Run the Development Server
```bash
# In one terminal:
cd server && npm run dev

# In a second terminal:
cd client && npm run dev
```

### 4. Running Verification & Tests
```bash
# Server unit and security tests
cd server && npm test

# Client test suite
cd client && npm test
```

## Database Management
NEXORA utilizes SQLite with WAL (Write-Ahead Logging) mode enabled for high performance, zero-friction local development, and Postgres-ready SQL patterns for production scalability. Database files are created under `server/data/nexora.db` and are ignored in git.
