const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { sequelize } = require('./models');
const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const apiRoutes = require('./routes/api');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(attachUser);

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/', postRoutes);

module.exports = { app, sequelize };
