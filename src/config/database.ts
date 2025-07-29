import { Sequelize } from 'sequelize';
require('dotenv').config();

const sequelize = new Sequelize(String(process.env.DB_NAME), String(process.env.DB_USER), String(process.env.DB_PASS), {
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    host: process.env.DB_HOST,
    port: 3306,
    timezone: "-03:00", // horário de Brasília
    pool: {
        max: 20,      // Número máximo de conexões abertas
        min: 5,       // Número mínimo de conexões
        acquire: 60000, // Tempo máximo para tentar adquirir uma conexão (60 segundos)
        idle: 10000    // Tempo máximo que uma conexão pode ficar ociosa (10 segundos)
      },
      logging: false, // opcional: desativa logs de SQL no console
});

export default sequelize;
