const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

function createSequelize() {
  const url = process.env.DATABASE_URL;
  if (url === 'sqlite::memory:' || url === ':memory:') {
    return new Sequelize('sqlite::memory:', { logging: false });
  }
  const storage = url
    ? url.replace(/^sqlite:/, '')
    : path.join(__dirname, '..', '..', 'data', 'blog.sqlite');
  const dir = path.dirname(storage);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return new Sequelize({ dialect: 'sqlite', storage, logging: false });
}

const sequelize = createSequelize();
module.exports = { sequelize };
