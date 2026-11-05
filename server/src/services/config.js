/**
 * Environment configuration validator.
 * Validates presence, length, and strength of required secrets.
 * Refuses startup in production if secrets are missing, weak, or known placeholders.
 */

const KNOWN_PLACEHOLDERS = [
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'YOUR_64_CHAR_HEX_ENCRYPTION_KEY_HERE_GENERATE_WITH_CRYPTO_RANDOMBYTES',
  'dev_session_secret_change_in_production_min_32_chars',
  'YOUR_MIN_32_CHAR_SESSION_SECRET_HERE_CHANGE_IN_PRODUCTION'
];

function validateEnvironment() {
  const isProd = process.env.NODE_ENV === 'production';
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const sessionSecret = process.env.SESSION_SECRET;

  const errors = [];

  // 1. Validate ENCRYPTION_KEY
  if (!encryptionKey) {
    errors.push('ENCRYPTION_KEY is required.');
  } else {
    const isHex = /^[0-9a-fA-F]{64}$/.test(encryptionKey);
    if (!isHex) {
      errors.push('ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes).');
    }
    if (isProd && KNOWN_PLACEHOLDERS.includes(encryptionKey)) {
      errors.push('ENCRYPTION_KEY cannot use default/known placeholder keys in production.');
    }
  }

  // 2. Validate SESSION_SECRET
  if (!sessionSecret) {
    if (isProd) {
      errors.push('SESSION_SECRET is required in production.');
    }
  } else {
    if (sessionSecret.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters long.');
    }
    if (isProd && KNOWN_PLACEHOLDERS.includes(sessionSecret)) {
      errors.push('SESSION_SECRET cannot use default/known placeholder values in production.');
    }
  }

  // 3. Validate CORS_ORIGIN in production
  if (isProd) {
    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.trim() === '') {
      errors.push('CORS_ORIGIN must be explicitly defined in production (e.g. https://yourdomain.com).');
    } else if (process.env.CORS_ORIGIN.includes('*')) {
      errors.push('CORS_ORIGIN cannot contain wildcard (*) in production.');
    }
  }

  if (errors.length > 0) {
    const msg = `[CRITICAL CONFIGURATION ERROR]: Environment validation failed:\n  - ${errors.join('\n  - ')}`;
    if (isProd) {
      console.error(msg);
      throw new Error(msg);
    } else {
      console.warn(`[CONFIG WARNING] Non-production environment warning:\n  - ${errors.join('\n  - ')}`);
    }
  }
}

module.exports = {
  validateEnvironment,
  KNOWN_PLACEHOLDERS
};
