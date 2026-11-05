/**
 * Sanitizes external error messages to prevent leakage of API keys, bearer tokens,
 * authorization headers, or internal stack traces.
 */
function sanitizeErrorMessage(errMsg, apiKey = null) {
  if (!errMsg || typeof errMsg !== 'string') {
    return 'An unexpected provider error occurred.';
  }

  let sanitized = errMsg;

  // Redact specific API key if provided
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 5) {
    sanitized = sanitized.replaceAll(apiKey, '[REDACTED_API_KEY]');
  }

  // Redact common key formats (sk-..., gsk_..., xai-..., etc.)
  sanitized = sanitized.replace(/(?:sk-|gsk_|ai-|key-|bearer\s+)[a-zA-Z0-9_\-]{8,}/gi, '[REDACTED_SECRET]');

  // Redact authorization header patterns and query params like ?key=...
  sanitized = sanitized.replace(/key=[a-zA-Z0-9_\-%]+/gi, 'key=[REDACTED]');
  sanitized = sanitized.replace(/authorization:\s*[^\r\n,]+/gi, 'Authorization: [REDACTED]');

  // Remove internal stack trace lines
  sanitized = sanitized.split('\n')
    .filter(line => !line.trim().startsWith('at ') && !line.includes('/node_modules/'))
    .join('\n')
    .trim();

  return sanitized || 'Provider request failed.';
}

module.exports = {
  sanitizeErrorMessage
};
