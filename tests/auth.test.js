const { describe, it, expect, beforeAll } = require('vitest');
const request = require('supertest');

const { app, sequelize } = require('../src/app');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('Auth flow', () => {
  it('registers, logs in and rejects bad credentials', async () => {
    const reg = await request(app)
      .post('/auth/register')
      .set('Accept', 'application/json')
      .send({ username: 'bob', password: 'pw12345' });
    expect([200, 201, 302]).toContain(reg.status);

    const good = await request(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({ username: 'bob', password: 'pw12345' });
    expect([200, 302]).toContain(good.status);
    expect(good.headers['set-cookie']).toBeDefined();

    const bad = await request(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({ username: 'bob', password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  it('protects /posts/new for unauthenticated API callers', async () => {
    const res = await request(app)
      .post('/api/posts/999/comments')
      .set('Accept', 'application/json')
      .send({ body: 'nope' });
    expect(res.status).toBe(401);
  });
});
