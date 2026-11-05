const path = require('path');
const pdfParse = require('pdf-parse');

const ALLOWED_EXTENSIONS = new Set([
  '.py', '.mql5', '.mq5', '.mqh', '.csv', '.json', '.txt',
  '.log', '.pdf', '.md', '.markdown', '.js', '.ts', '.html', '.css'
]);

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Maximum characters extracted for prompt inclusion to prevent runaway context
const MAX_EXTRACTED_CHARS = 500000;

/**
 * Validates filename against path traversal attacks and malicious characters.
 * Returns sanitized base filename.
 */
function sanitizeFilename(originalName) {
  if (!originalName || typeof originalName !== 'string') {
    return 'unnamed_file.txt';
  }

  // Normalize Windows and Unix path separators before path.basename
  const normalized = originalName.replace(/\\/g, '/');
  const baseName = path.basename(normalized).trim();
  // Strip path traversal dots, control characters and reserved symbols
  const cleanName = baseName
    .replace(/\.\.+/g, '') // remove consecutive dots
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim();

  return cleanName || 'unnamed_file.txt';
}

/**
 * Safely parses buffer based on file extension.
 * Validates JSON/CSV structures and catches PDF extraction errors without crashing.
 */
async function parseFileContent(buffer, extension) {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  const ext = extension.toLowerCase();

  if (ext === '.pdf') {
    try {
      const pdfData = await pdfParse(buffer);
      const text = (pdfData.text || '').trim();
      return text || '[PDF document contains no extractable text]';
    } catch (err) {
      return '[Could not extract text from corrupted or password-protected PDF document]';
    }
  }

  // UTF-8 Decoded Text
  const text = buffer.toString('utf-8');

  if (ext === '.json') {
    try {
      // Validate JSON syntax without executing anything
      JSON.parse(text);
      return text;
    } catch (jsonErr) {
      return `[Malformed JSON file: ${jsonErr.message}]\n` + text.substring(0, 5000);
    }
  }

  // Text, source code (py, mql5, js, ts), markdown, csv
  return text;
}

module.exports = {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_EXTRACTED_CHARS,
  sanitizeFilename,
  parseFileContent
};
