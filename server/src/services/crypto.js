const crypto = require('crypto');

// Algorithm: aes-256-gcm
// Key must be 32 bytes (256 bits)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string representing 32 bytes');
  }
  return key;
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Returns { encryptedData, iv, authTag } as hex strings.
 */
function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext string is required for encryption');
  }
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag
  };
}

/**
 * Decrypts ciphertext with IV and Auth Tag using AES-256-GCM.
 * Returns original plaintext string.
 */
function decrypt(encryptedData, ivHex, authTagHex) {
  if (!encryptedData || !ivHex || !authTagHex) {
    throw new Error('Missing parameters for decryption');
  }
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Secure password hashing using scrypt (Node.js crypto native)
 */
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Secure password verification using timingSafeEqual
 */
function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return resolve(false);
    const [salt, key] = parts;
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, 'hex');
      if (keyBuffer.length !== derivedKey.length) return resolve(false);
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}

/**
 * Redacts known sensitive fields (API keys, authorization tokens)
 */
function redactSecrets(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const cloned = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(cloned)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('key') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('password') ||
      lowerKey.includes('auth')
    ) {
      if (typeof cloned[key] === 'string' && cloned[key].length > 4) {
        cloned[key] = `${cloned[key].substring(0, 3)}...[REDACTED]`;
      } else {
        cloned[key] = '[REDACTED]';
      }
    } else if (typeof cloned[key] === 'object') {
      cloned[key] = redactSecrets(cloned[key]);
    }
  }
  return cloned;
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  redactSecrets
};
