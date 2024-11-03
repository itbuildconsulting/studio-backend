import { Sequelize } from 'sequelize';
require('dotenv').config();

const sequelize = new Sequelize(String(process.env.DB_NAME), String(process.env.DB_USER), String(process.env.DB_PASS), {
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    host: process.env.DB_HOST,
    port: 3306,
});

export default sequelize;
