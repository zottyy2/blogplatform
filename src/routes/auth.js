const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sign } = require('../middleware/auth');

const router = express.Router();

router.get('/register', (req, res) => res.render('register', { user: req.user, error: null }));
router.get('/login', (req, res) => res.render('login', { user: req.user, error: null }));

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).render('register', { user: null, error: 'Felhasználónév és jelszó kötelező.' });
  }
  const exists = await User.findOne({ where: { username } });
  if (exists) {
    return res.status(400).render('register', { user: null, error: 'A felhasználónév foglalt.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  const token = sign(user);
  res.cookie('token', token, { httpOnly: true });
  if (req.accepts('json') && !req.accepts('html')) return res.status(201).json({ token });
  res.redirect('/');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  const ok = user && (await bcrypt.compare(password || '', user.passwordHash));
  if (!ok) {
    if (req.accepts('json') && !req.accepts('html')) return res.status(401).json({ error: 'invalid credentials' });
    return res.status(401).render('login', { user: null, error: 'Hibás felhasználónév vagy jelszó.' });
  }
  const token = sign(user);
  res.cookie('token', token, { httpOnly: true });
  if (req.accepts('json') && !req.accepts('html')) return res.json({ token });
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
