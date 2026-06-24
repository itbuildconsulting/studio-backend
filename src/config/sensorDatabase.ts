import { Sequelize } from 'sequelize';
require('dotenv').config();

// Conexao separada para o banco do sensor-service (bike-sensor), que e
// independente do banco principal do studio-backend.
const sensorSequelize = new Sequelize(
  String(process.env.SENSOR_DB_NAME),
  String(process.env.SENSOR_DB_USER),
  String(process.env.SENSOR_DB_PASS),
  {
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    host: process.env.SENSOR_DB_HOST,
    port: Number(process.env.SENSOR_DB_PORT) || 3306,
    timezone: '-03:00',
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 600000,
    },
    logging: false,
  }
);

export default sensorSequelize;
