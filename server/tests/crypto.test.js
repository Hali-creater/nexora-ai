const test = require('node:test');
const assert = require('node:assert');

// Set test environment encryption key (32 bytes hex)
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const { encrypt, decrypt, hashPassword, verifyPassword, redactSecrets } = require('../src/services/crypto');

test('Crypto: AES-256-GCM encryption and decryption roundtrip', () => {
  const secretApiKey = 'sk-or-v1-abcdef0123456789testkey';
  const { encryptedData, iv, authTag } = encrypt(secretApiKey);

  assert.ok(encryptedData && encryptedData !== secretApiKey);
  assert.ok(iv);
  assert.ok(authTag);

  const decrypted = decrypt(encryptedData, iv, authTag);
  assert.strictEqual(decrypted, secretApiKey);
});

test('Crypto: Tampered ciphertext or authTag fails decryption', () => {
  const secretApiKey = 'sk-or-v1-secret';
  const { encryptedData, iv, authTag } = encrypt(secretApiKey);

  // Alter authTag slightly
  const corruptedTag = '00' + authTag.slice(2);
  assert.throws(() => {
    decrypt(encryptedData, iv, corruptedTag);
  });
});

test('Crypto: Scrypt password hashing and verification', async () => {
  const plainPassword = 'SuperSecurePassword123!';
  const hash = await hashPassword(plainPassword);

  assert.ok(hash.includes(':'));
  const isValid = await verifyPassword(plainPassword, hash);
  assert.strictEqual(isValid, true);

  const isInvalid = await verifyPassword('WrongPassword', hash);
  assert.strictEqual(isInvalid, false);
});

test('Crypto: Redact sensitive secrets from objects', () => {
  const payload = {
    apiKey: 'sk-1234567890abcdef',
    token: 'jwt.token.here',
    username: 'alice',
    nested: {
      password: 'password123',
      provider: 'openai'
    }
  };

  const redacted = redactSecrets(payload);
  assert.strictEqual(redacted.username, 'alice');
  assert.ok(redacted.apiKey.includes('[REDACTED]'));
  assert.ok(redacted.token.includes('[REDACTED]'));
  assert.ok(redacted.nested.password.includes('[REDACTED]'));
  assert.strictEqual(redacted.nested.provider, 'openai');
});
