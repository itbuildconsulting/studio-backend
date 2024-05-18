const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    dialect: 'mysql',
    dialectModule: mysql2, // Needed to fix sequelize issues with WebPack
    host: 'localhost',
    port: 3306,
});

module.exports = sequelize;