const express = require('express');
const { Post, Comment, User } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const posts = await Post.findAll({
    include: [{ model: User, as: 'author', attributes: ['username'] }],
    order: [['createdAt', 'DESC']],
  });
  res.render('index', { user: req.user, posts });
});

router.get('/posts/new', requireAuth, (req, res) => {
  res.render('new-post', { user: req.user, error: null });
});

router.post('/posts', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).render('new-post', { user: req.user, error: 'Cím és tartalom kötelező.' });
  }
  const post = await Post.create({ title, content, authorId: req.user.id });
  res.redirect(`/posts/${post.id}`);
});

router.get('/posts/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: [
      { model: User, as: 'author', attributes: ['username'] },
      { model: Comment, include: [{ model: User, as: 'author', attributes: ['username'] }] },
    ],
  });
  if (!post) return res.status(404).send('Not found');
  res.render('post', { user: req.user, post });
});

router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).send('Not found');
  const { body } = req.body;
  if (!body) return res.redirect(`/posts/${post.id}`);
  await Comment.create({ body, postId: post.id, authorId: req.user.id });
  res.redirect(`/posts/${post.id}`);
});

module.exports = router;
