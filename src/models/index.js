const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'user' },
});

const Post = sequelize.define('Post', {
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
});

const Comment = sequelize.define('Comment', {
  body: { type: DataTypes.TEXT, allowNull: false },
});

User.hasMany(Post, { foreignKey: 'authorId', onDelete: 'CASCADE' });
Post.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

User.hasMany(Comment, { foreignKey: 'authorId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

module.exports = { sequelize, User, Post, Comment };
