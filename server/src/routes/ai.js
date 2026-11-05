const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { getAdapter } = require('../adapters');
const { MODEL_CATALOG } = require('../adapters/base');
const { getDecryptedKey } = require('./keys');

const router = express.Router();

// 1. Get Models Catalog (with provider capabilities and search/filter info)
router.get('/models', (req, res) => {
  return res.json({ models: MODEL_CATALOG });
});

// 2. Validate API Key for a Provider
router.post('/validate-key', authMiddleware, async (req, res) => {
  try {
    const { providerId, apiKey } = req.body;
    if (!providerId || !apiKey) {
      return res.status(400).json({ error: 'Provider ID and API key are required' });
    }

    const adapter = getAdapter(providerId);
    if (!adapter) {
      return res.status(400).json({ error: `Provider ${providerId} is not supported` });
    }

    const result = await adapter.testKey(apiKey.trim());
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      valid: false,
      error: err.message || 'Key validation failed'
    });
  }
});

// 3. BYOK Stream Chat (SSE)
router.post('/stream', authMiddleware, async (req, res) => {
  const {
    conversationId,
    providerId,
    modelId,
    messages,
    ephemeralApiKey, // Optional session-only key provided by client
    temperature,
    maxTokens
  } = req.body;

  if (!providerId || !modelId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'providerId, modelId, and messages array are required' });
  }

  // Retrieve API Key: Prioritize ephemeral key, fallback to encrypted DB key
  let apiKey = ephemeralApiKey?.trim();
  if (!apiKey) {
    apiKey = getDecryptedKey(req.user.id, providerId);
  }

  if (!apiKey) {
    return res.status(400).json({
      error: `No API key found for provider '${providerId}'. Please add your API key in Settings or supply an ephemeral key.`
    });
  }

  const adapter = getAdapter(providerId);
  if (!adapter) {
    return res.status(400).json({ error: `Adapter for provider '${providerId}' not found.` });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let fullResponse = '';
  const startTime = Date.now();

  try {
    await adapter.streamChat(
      messages,
      { apiKey, model: modelId, temperature, maxTokens },
      (chunk) => {
        if (chunk.done) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        } else if (chunk.text) {
          fullResponse += chunk.text;
          res.write(`data: ${JSON.stringify({ delta: chunk.text })}\n\n`);
        }
      }
    );

    const durationMs = Date.now() - startTime;
    // Rough token estimate (avg ~4 chars per token)
    const tokensOut = Math.round(fullResponse.length / 4);
    const tokensIn = messages.reduce((acc, m) => acc + Math.round((m.content || '').length / 4), 0);

    // Save usage metrics in DB
    try {
      db.prepare(`
        INSERT INTO provider_usage (id, user_id, provider_id, model_id, tokens_in, tokens_out, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), req.user.id, providerId, modelId, tokensIn, tokensOut, durationMs);
    } catch (e) {
      console.error('Failed to log usage:', e);
    }

    res.end();
  } catch (err) {
    console.error('Stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Stream generation failed' })}\n\n`);
    res.end();
  }
});

// 4. Log Puter Usage (Called by frontend after user-pays Puter completion)
router.post('/log-puter-usage', authMiddleware, (req, res) => {
  try {
    const { modelId, tokensIn, tokensOut, durationMs } = req.body;
    db.prepare(`
      INSERT INTO provider_usage (id, user_id, provider_id, model_id, tokens_in, tokens_out, duration_ms)
      VALUES (?, ?, 'puter', ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user.id,
      modelId || 'puter-ai',
      tokensIn || 0,
      tokensOut || 0,
      durationMs || 0
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record Puter usage' });
  }
});

// 5. Get Aggregate Usage Dashboard Data
router.get('/usage', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT provider_id, model_id, tokens_in, tokens_out, duration_ms, created_at
      FROM provider_usage
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.user.id);

    const totals = db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(tokens_in) as total_tokens_in,
        SUM(tokens_out) as total_tokens_out,
        AVG(duration_ms) as avg_duration_ms
      FROM provider_usage
      WHERE user_id = ?
    `).get(req.user.id);

    return res.json({
      records: rows,
      summary: {
        totalRequests: totals.total_requests || 0,
        totalTokensIn: totals.total_tokens_in || 0,
        totalTokensOut: totals.total_tokens_out || 0,
        avgDurationMs: Math.round(totals.avg_duration_ms || 0)
      }
    });
  } catch (err) {
    console.error('Usage dashboard error:', err);
    return res.status(500).json({ error: 'Failed to retrieve usage stats' });
  }
});

module.exports = router;
