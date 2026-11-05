const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const { router: keysRoutes } = require('./routes/keys');
const aiRoutes = require('./routes/ai');
const conversationsRoutes = require('./routes/conversations');
const projectsRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware with tested Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.puter.com"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://js.puter.com"],
      connectSrc: ["'self'", "https://*.puter.com", "https://api.openai.com", "https://api.anthropic.com", "https://openrouter.ai", "https://generativelanguage.googleapis.com", "https://api.groq.com", "https://api.deepseek.com", "https://api.mistral.ai"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://*.puter.com", "https://puter.com"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false // Prevents breaking Puter SDK iframes
}));

const { validateEnvironment } = require('./services/config');

// Execute startup security and secret validation
validateEnvironment();

// Strict CORS Configuration
const isProd = process.env.NODE_ENV === 'production';
const rawOrigins = process.env.CORS_ORIGIN || (isProd ? '' : 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173');
const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server or mobile apps if applicable, or same-origin direct requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (!isProd) {
      // In non-production, permit localhost origins for developer convenience
      try {
        const parsed = new URL(origin);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (_) {}
    }

    // Reject unknown origin in production or unauthorized origin in dev
    return callback(new Error(`Origin '${origin}' not permitted by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NEXORA AI Backend API'
  });
});

// Advertising configuration endpoint (disabled by default)
app.get('/api/config/ads', (req, res) => {
  res.json({
    enabled: process.env.ADS_ENABLED === 'true',
    provider: process.env.ADS_PROVIDER || 'none',
    bannerPlacements: {
      publicHome: true,
      features: true,
      docs: true,
      chatInterface: false, // Never inject ads into private chat workspaces
      authScreens: false
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/projects', projectsRoutes);

// Serve static client assets in production if built
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[NEXORA AI Server] running on http://localhost:${PORT}`);
  });
}

module.exports = app;
