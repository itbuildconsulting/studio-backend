const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
});

module.exports = sequelize;