# NEXORA AI - Portable Deployment Guide

NEXORA AI is designed for modular, environment-agnostic deployment. It can be deployed in multiple configurations:

## 1. Architecture Variants
- **Full-Stack Container (Recommended):** Build the frontend into static assets served directly by the Node/Express backend or run both behind Nginx / Caddy reverse proxy.
- **Decoupled Architecture:**
  - Frontend hosted on Vercel, Netlify, Cloudflare Pages, or Puter Hosting.
  - Backend API hosted on Railway, Render, Fly.io, or VPS (Ubuntu/Docker).
  - PostgreSQL managed database or persistent NVMe volume SQLite.

## 2. Docker Deployment
```bash
# Build unified production container
docker build -t nexora-ai .

# Run container with environment configuration
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e ENCRYPTION_KEY=<your-32-byte-hex-key> \
  -e SESSION_SECRET=<strong-random-session-secret> \
  -v nexora-data:/app/server/data \
  --name nexora nexora-ai
```

## 3. Environment Variables Reference
| Variable | Required | Description |
|---|---|---|
| `PORT` | No (Default: 5000) | Port for Node API service. |
| `NODE_ENV` | Yes | `development` or `production`. |
| `ENCRYPTION_KEY` | Yes (in prod) | 64-character hex string (32 bytes) for AES-256-GCM. |
| `SESSION_SECRET` | Yes (in prod) | Secret string for HMAC session cookie signing. |
| `CORS_ORIGIN` | No | Restrict frontend origin in production (e.g. `https://app.nexora.ai`). |
| `DATABASE_PATH` | No | Custom path to SQLite db (default: `./data/nexora.db`). |

## 4. Reverse Proxy (Nginx) Example
```nginx
server {
    listen 80;
    server_name nexora.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # SSE Streaming requirements:
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```
