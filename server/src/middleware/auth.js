const crypto = require('crypto');
const db = require('../db');

function hashIp(ip) {
  if (!ip) return 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

/**
 * Authentication middleware
 * Checks 'nexora_session' cookie or 'Authorization: Bearer <token>' header.
 * Attaches req.user = { id, email, name }
 */
function authMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  let sessionId = cookies.nexora_session;

  if (!sessionId && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
    }
  }

  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }

  const stmt = db.prepare(`
    SELECT s.id as session_id, s.expires_at, u.id as user_id, u.email, u.name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `);

  const row = stmt.get(sessionId);

  if (!row) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid' });
  }

  const now = new Date();
  const expiresAt = new Date(row.expires_at);

  if (now > expiresAt) {
    // Delete expired session
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return res.status(401).json({ error: 'Unauthorized: Session expired' });
  }

  req.user = {
    id: row.user_id,
    email: row.email,
    name: row.name
  };
  req.sessionId = sessionId;

  next();
}

/**
 * Optional authentication middleware:
 * Populates req.user if a valid session exists, but allows guest access if absent.
 */
function optionalAuthMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  let sessionId = cookies.nexora_session;

  if (!sessionId && req.headers.authorization?.startsWith('Bearer ')) {
    sessionId = req.headers.authorization.substring(7).trim();
  }

  if (sessionId) {
    const stmt = db.prepare(`
      SELECT s.id as session_id, s.expires_at, u.id as user_id, u.email, u.name
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `);
    const row = stmt.get(sessionId);
    if (row && new Date() <= new Date(row.expires_at)) {
      req.user = {
        id: row.user_id,
        email: row.email,
        name: row.name
      };
      req.sessionId = sessionId;
    }
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  hashIp,
  parseCookies
};
