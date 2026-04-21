const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SECRET = () => process.env.JWT_SECRET || 'dev-secret';

function sign(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET(), { expiresIn: '7d' });
}

async function attachUser(req, _res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = bearer || req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET());
      req.user = await User.findByPk(payload.id);
    } catch (_) { /* invalid token ignored */ }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

module.exports = { sign, attachUser, requireAuth };
