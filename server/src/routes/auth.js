const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { hashPassword, verifyPassword } = require('../services/crypto');
const { authMiddleware, hashIp } = require('../middleware/auth');

const router = express.Router();
const SESSION_DURATION_DAYS = 30;

function createSession(userId, req) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const userAgent = req.headers['user-agent'] || 'unknown';
  const ipHash = hashIp(req.ip || req.connection?.remoteAddress);

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, user_agent, ip_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, userId, expiresAt.toISOString(), userAgent, ipHash);

  return { sessionId, expiresAt };
}

function setSessionCookie(res, sessionId, expiresAt) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `nexora_session=${sessionId}`,
    `Path=/`,
    `Expires=${expiresAt.toUTCString()}`,
    'HttpOnly',
    'SameSite=Lax',
    ...(isProd ? ['Secure'] : [])
  ].join('; ');

  res.setHeader('Set-Cookie', cookieOptions);
}

// 1. Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(userId, normalizedEmail, passwordHash, name.trim());

    // Create session
    const { sessionId, expiresAt } = createSession(userId, req);
    setSessionCookie(res, sessionId, expiresAt);

    // Seed default project: AETHER-HERMES LAB
    const projectId = crypto.randomUUID();
    const starterInstructions = `You are an elite quantitative trading strategy engineer and MQL5/Python specialist in the AETHER-HERMES LAB.
Expertise covers:
- Python quant architectures (NumPy, pandas, vectorbt, Backtrader)
- MetaTrader 5 (MT5) IPC & MQL5 expert advisors (EAs)
- Strategy engineering: Order flow, Volume Profile, Delta analysis, Order Book imbalances
- Rigorous risk management: fixed fractional, Kelly criterion, position sizing
- Robust verification: Walk-forward optimization, Out-of-sample testing, Monte Carlo permutations
- Performance metrics: Profit factor, Expectancy, Win rate, Maximum drawdown, Sharpe/Sortino ratios
- Execution quality: Slippage modeling, latency arbitrage mitigation, broker compatibility & prop-firm constraints.

Always analyze user-supplied source files objectively. Never invent historical backtest metrics or assume simulated results apply directly to live market microstructure.`;

    db.prepare(`
      INSERT INTO projects (id, user_id, name, description, system_instructions)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      projectId,
      userId,
      'AETHER-HERMES LAB',
      'Algorithmic trading development workspace (Python & MT5 / MQL5)',
      starterInstructions
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_events (id, user_id, action, ip_hash)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), userId, 'USER_REGISTERED', hashIp(req.ip));

    return res.status(201).json({
      user: {
        id: userId,
        email: normalizedEmail,
        name: name.trim()
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
});

// 2. Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { sessionId, expiresAt } = createSession(user.id, req);
    setSessionCookie(res, sessionId, expiresAt);

    db.prepare(`
      INSERT INTO audit_events (id, user_id, action, ip_hash)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), user.id, 'USER_LOGIN', hashIp(req.ip));

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});

// 3. Logout
router.post('/logout', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
    res.setHeader('Set-Cookie', 'nexora_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly');
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// 4. Current user session check
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    user: req.user
  });
});

// 5. Update Profile
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be blank' });
    }

    db.prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name.trim(), req.user.id);

    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: name.trim()
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 6. Delete account
router.delete('/me', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.setHeader('Set-Cookie', 'nexora_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly');
    return res.json({ success: true, message: 'Account permanently deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
