const test = require('node:test');
const assert = require('node:assert');
const { sanitizeFilename, parseFileContent, ALLOWED_EXTENSIONS } = require('../src/services/fileSecurity');

test('File Security: Prevents directory traversal in uploaded filenames', () => {
  const maliciousName1 = '../../../../etc/passwd';
  const clean1 = sanitizeFilename(maliciousName1);
  assert.strictEqual(clean1, 'passwd');

  const maliciousName2 = '..\\..\\windows\\system32\\calc.exe';
  const clean2 = sanitizeFilename(maliciousName2);
  assert.ok(!clean2.includes('..'));
});

test('File Security: Rejects executable or dangerous extensions', () => {
  const dangerous = ['.exe', '.sh', '.bat', '.cmd', '.php', '.bin', '.dll'];
  for (const ext of dangerous) {
    assert.strictEqual(ALLOWED_EXTENSIONS.has(ext), false, `${ext} must not be allowed`);
  }
});

test('File Security: Safely parses malformed JSON without server crash', async () => {
  const malformedJson = Buffer.from('{ "broken": [1, 2, 3 }');
  const result = await parseFileContent(malformedJson, '.json');
  assert.ok(result.includes('[Malformed JSON file:'));
});

test('File Security: Safely handles corrupted PDF buffers gracefully', async () => {
  const corruptedPdf = Buffer.from('%PDF-1.4 Not A Valid Binary Stream End');
  const result = await parseFileContent(corruptedPdf, '.pdf');
  assert.ok(result.includes('Could not extract text from corrupted'));
});
