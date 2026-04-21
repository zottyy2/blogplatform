const request = require('supertest');
const bcrypt = require('bcryptjs');

const { app, sequelize } = require('../src/app');
const { User, Post } = require('../src/models');

let authCookie;
let postId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const user = await User.create({
    username: 'alice',
    passwordHash: await bcrypt.hash('secret123', 10),
  });
  const post = await Post.create({
    title: 'Első poszt',
    content: 'Helló világ',
    authorId: user.id,
  });
  postId = post.id;

  const login = await request(app)
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({ username: 'alice', password: 'secret123' });
  authCookie = login.headers['set-cookie'];
});

describe('Posts API', () => {
  it('GET /api/posts returns the list of posts', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toBe('Első poszt');
  });

  it('GET /api/posts/:id returns a post with comments array', async () => {
    const res = await request(app).get(`/api/posts/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(postId);
    expect(Array.isArray(res.body.Comments)).toBe(true);
  });

  it('POST /api/posts/:id/comments requires auth', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Accept', 'application/json')
      .send({ body: 'hi' });
    expect(res.status).toBe(401);
  });

  it('POST /api/posts/:id/comments creates a comment when authed', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Cookie', authCookie)
      .send({ body: 'Jó cikk!' });
    expect(res.status).toBe(201);
    expect(res.body.body).toBe('Jó cikk!');
  });
});
