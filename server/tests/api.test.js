const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';

const app = require('../src/index');

test('Health Check API returns healthy status', async () => {
  const res = await request(app).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'healthy');
});

test('Auth flow: register, login, session validation, logout', async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'StrongPassword123!';

  // 1. Register
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name: 'Alice Quant' });

  assert.strictEqual(regRes.status, 201);
  assert.strictEqual(regRes.body.user.email, email);
  const cookie = regRes.headers['set-cookie'];
  assert.ok(cookie);

  // 2. Validate session (/me)
  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Cookie', cookie);

  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.user.email, email);

  // 3. Check automatically seeded project AETHER-HERMES LAB
  const projRes = await request(app)
    .get('/api/projects')
    .set('Cookie', cookie);

  assert.strictEqual(projRes.status, 200);
  assert.ok(projRes.body.projects.length >= 1);
  assert.strictEqual(projRes.body.projects[0].name, 'AETHER-HERMES LAB');
  assert.ok(projRes.body.projects[0].system_instructions.includes('quantitative trading'));

  // 4. Logout
  const logoutRes = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', cookie);
  assert.strictEqual(logoutRes.status, 200);

  // 5. Subsequent /me should fail
  const postLogoutRes = await request(app)
    .get('/api/auth/me')
    .set('Cookie', cookie);
  assert.strictEqual(postLogoutRes.status, 401);
});

test('Security & Tenant Isolation: User B cannot access User A conversations', async () => {
  // Create User A
  const userARes = await request(app)
    .post('/api/auth/register')
    .send({ email: `usera_${Date.now()}@example.com`, password: 'Password123!', name: 'User A' });
  const cookieA = userARes.headers['set-cookie'];

  // User A creates conversation
  const convRes = await request(app)
    .post('/api/conversations')
    .set('Cookie', cookieA)
    .send({ title: 'User A Secret Chat', modelId: 'gpt-4o', providerId: 'openai' });
  assert.strictEqual(convRes.status, 201);
  const convId = convRes.body.conversation.id;

  // Create User B
  const userBRes = await request(app)
    .post('/api/auth/register')
    .send({ email: `userb_${Date.now()}@example.com`, password: 'Password123!', name: 'User B' });
  const cookieB = userBRes.headers['set-cookie'];

  // User B attempts to access User A's conversation
  const stealRes = await request(app)
    .get(`/api/conversations/${convId}`)
    .set('Cookie', cookieB);
  assert.strictEqual(stealRes.status, 404);

  // User B attempts to delete User A's conversation
  const deleteRes = await request(app)
    .delete(`/api/conversations/${convId}`)
    .set('Cookie', cookieB);
  assert.strictEqual(deleteRes.status, 404);
});
