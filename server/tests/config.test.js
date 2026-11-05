const test = require('node:test');
const assert = require('node:assert');
const { validateEnvironment, KNOWN_PLACEHOLDERS } = require('../src/services/config');

test('Config: refuses production startup if required secrets are placeholders or missing', () => {
  const origEnv = { ...process.env };

  try {
    // 1. Missing ENCRYPTION_KEY in production
    process.env.NODE_ENV = 'production';
    delete process.env.ENCRYPTION_KEY;
    process.env.SESSION_SECRET = 'a'.repeat(32);
    process.env.CORS_ORIGIN = 'https://app.nexora.ai';

    assert.throws(() => validateEnvironment(), /ENCRYPTION_KEY is required/);

    // 2. Placeholder ENCRYPTION_KEY in production
    process.env.ENCRYPTION_KEY = KNOWN_PLACEHOLDERS[0];
    assert.throws(() => validateEnvironment(), /cannot use default\/known placeholder keys/);

    // 3. Weak SESSION_SECRET in production (< 32 chars)
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    process.env.SESSION_SECRET = 'short';
    assert.throws(() => validateEnvironment(), /SESSION_SECRET must be at least 32 characters long/);

    // 4. Missing CORS_ORIGIN in production
    process.env.SESSION_SECRET = 'b'.repeat(32);
    delete process.env.CORS_ORIGIN;
    assert.throws(() => validateEnvironment(), /CORS_ORIGIN must be explicitly defined in production/);

    // 5. Valid production setup succeeds
    process.env.CORS_ORIGIN = 'https://app.nexora.ai';
    assert.doesNotThrow(() => validateEnvironment());
  } finally {
    process.env = origEnv;
  }
});
