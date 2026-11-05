const test = require('node:test');
const assert = require('node:assert');
const { sanitizeErrorMessage } = require('../src/services/sanitizer');

test('Sanitizer: Redacts API keys, authorization tokens, query params and stack traces', () => {
  const rawKey = 'sk-or-v1-abcdef0123456789testkey';
  const rawError = `Error: Request failed with status 401 for key ${rawKey}\n  at /app/node_modules/fetch/index.js:42:15\n  at async run (/app/server/src/adapters/index.js:90:5)`;

  const sanitized = sanitizeErrorMessage(rawError, rawKey);

  assert.ok(!sanitized.includes(rawKey));
  assert.ok(sanitized.includes('[REDACTED_API_KEY]') || sanitized.includes('[REDACTED_SECRET]'));
  assert.ok(!sanitized.includes('at /app/node_modules/'));
  assert.ok(!sanitized.includes('at async run'));
});

test('Sanitizer: Redacts Gemini-style ?key= query parameters', () => {
  const urlErr = 'Failed to fetch https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyD-1234567890abcdef';
  const sanitized = sanitizeErrorMessage(urlErr);

  assert.ok(!sanitized.includes('AIzaSyD-1234567890abcdef'));
  assert.ok(sanitized.includes('key=[REDACTED]'));
});
