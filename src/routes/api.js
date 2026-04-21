const express = require('express');
const { Post, Comment, User } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/posts', async (_req, res) => {
  const posts = await Post.findAll({
    include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(posts);
});

router.get('/posts/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username'] },
      { model: Comment, include: [{ model: User, as: 'author', attributes: ['id', 'username'] }] },
    ],
  });
  if (!post) return res.status(404).json({ error: 'not found' });
  res.json(post);
});

router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: 'body required' });
  const comment = await Comment.create({ body, postId: post.id, authorId: req.user.id });
  res.status(201).json(comment);
});

module.exports = router;
