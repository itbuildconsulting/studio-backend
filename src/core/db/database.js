const { Sequelize } = require('sequelize');
require('dotenv').config();


// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
//     dialect: 'mysql',
//     dialectModule: require('mysql2'),
//     host: process.env.DB_HOST,
//     port: 3306,
// });

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    host: 'localhost',
    dialect: 'mysql'
  });

module.exports = sequelize;