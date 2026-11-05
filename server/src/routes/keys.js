const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { encrypt, decrypt } = require('../services/crypto');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Supported BYOK Providers catalog
const SUPPORTED_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', docUrl: 'https://openrouter.ai/keys' },
  { id: 'openai', name: 'OpenAI', docUrl: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic Claude', docUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'gemini', name: 'Google Gemini', docUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'groq', name: 'Groq', docUrl: 'https://console.groq.com/keys' },
  { id: 'deepseek', name: 'DeepSeek', docUrl: 'https://platform.deepseek.com/api_keys' },
  { id: 'mistral', name: 'Mistral AI', docUrl: 'https://console.mistral.ai/api-keys' }
];

// 1. List user configured providers (never returning raw keys)
router.get('/', authMiddleware, (req, res) => {
  try {
    const keys = db.prepare(`
      SELECT provider_id, label, created_at, updated_at
      FROM provider_keys
      WHERE user_id = ?
    `).all(req.user.id);

    const configuredMap = {};
    keys.forEach(k => {
      configuredMap[k.provider_id] = {
        configured: true,
        label: k.label,
        updatedAt: k.updated_at
      };
    });

    const providers = SUPPORTED_PROVIDERS.map(p => ({
      ...p,
      isConfigured: !!configuredMap[p.id],
      label: configuredMap[p.id]?.label || null,
      updatedAt: configuredMap[p.id]?.updatedAt || null
    }));

    return res.json({ providers });
  } catch (err) {
    console.error('List providers error:', err);
    return res.status(500).json({ error: 'Failed to retrieve provider keys' });
  }
});

// 2. Save encrypted provider API key
router.post('/save', authMiddleware, (req, res) => {
  try {
    const { providerId, apiKey, label } = req.body;

    if (!providerId || !apiKey) {
      return res.status(400).json({ error: 'Provider ID and API key are required' });
    }

    const providerValid = SUPPORTED_PROVIDERS.some(p => p.id === providerId);
    if (!providerValid) {
      return res.status(400).json({ error: `Unsupported provider: ${providerId}` });
    }

    const trimmedKey = apiKey.trim();
    if (trimmedKey.length < 8) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Encrypt with AES-256-GCM
    const { encryptedData, iv, authTag } = encrypt(trimmedKey);
    const keyId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO provider_keys (id, user_id, provider_id, encrypted_key, iv, auth_tag, label, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, provider_id) DO UPDATE SET
        encrypted_key = excluded.encrypted_key,
        iv = excluded.iv,
        auth_tag = excluded.auth_tag,
        label = excluded.label,
        updated_at = CURRENT_TIMESTAMP
    `).run(keyId, req.user.id, providerId, encryptedData, iv, authTag, label || null);

    return res.json({
      success: true,
      message: `API key for ${providerId} securely encrypted and saved.`
    });
  } catch (err) {
    console.error('Save provider key error:', err);
    return res.status(500).json({ error: 'Failed to securely store API key' });
  }
});

// 3. Remove provider API key
router.delete('/:providerId', authMiddleware, (req, res) => {
  try {
    const { providerId } = req.params;
    db.prepare(`
      DELETE FROM provider_keys
      WHERE user_id = ? AND provider_id = ?
    `).run(req.user.id, providerId);

    return res.json({
      success: true,
      message: `API key for ${providerId} permanently deleted.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Helper: retrieve and decrypt key for user
function getDecryptedKey(userId, providerId) {
  const row = db.prepare(`
    SELECT encrypted_key, iv, auth_tag
    FROM provider_keys
    WHERE user_id = ? AND provider_id = ?
  `).get(userId, providerId);

  if (!row) return null;
  return decrypt(row.encrypted_key, row.iv, row.auth_tag);
}

module.exports = {
  router,
  getDecryptedKey,
  SUPPORTED_PROVIDERS
};
