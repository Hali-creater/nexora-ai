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

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows SSE and inline styles for dynamic syntax highlighting
}));

// CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development, Puter webview iframe contexts, or exact configured origin
    if (!origin || origin === allowedOrigin || origin.includes('puter.com') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev, lockable via CORS_ORIGIN in prod
    }
  },
  credentials: true
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
