const test = require('node:test');
const assert = require('node:assert');

const { MODEL_CATALOG, BaseAdapter } = require('../src/adapters/base');
const { getAdapter, adapters } = require('../src/adapters');

test('Model Catalog: contains official Puter and BYOK models', () => {
  assert.ok(Array.isArray(MODEL_CATALOG));
  assert.ok(MODEL_CATALOG.length >= 10);

  const puterModels = MODEL_CATALOG.filter(m => m.provider === 'puter');
  assert.ok(puterModels.length >= 3);
  assert.ok(puterModels.some(m => m.id.includes('claude-3-7-sonnet')));

  const byokModels = MODEL_CATALOG.filter(m => m.accessMethod === 'byok');
  assert.ok(byokModels.length >= 7);
  assert.ok(byokModels.some(m => m.provider === 'openai'));
  assert.ok(byokModels.some(m => m.provider === 'gemini'));
  assert.ok(byokModels.some(m => m.provider === 'anthropic'));
  assert.ok(byokModels.some(m => m.provider === 'groq'));
  assert.ok(byokModels.some(m => m.provider === 'deepseek'));
});

test('Adapters: All supported providers have registered adapter instances', () => {
  const expected = ['openrouter', 'openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'mistral'];
  for (const id of expected) {
    const adapter = getAdapter(id);
    assert.ok(adapter, `Adapter for ${id} must exist`);
    assert.strictEqual(typeof adapter.streamChat, 'function');
    assert.strictEqual(typeof adapter.testKey, 'function');
  }
});
