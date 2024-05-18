const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    host: 'localhost',
    dialect: 'mysql'
  });
  
module.exports = sequelize;