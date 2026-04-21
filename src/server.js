const { app, sequelize } = require('./app');

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Blog running on http://localhost:${PORT}`));
});
