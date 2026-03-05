import { Sequelize } from 'sequelize';
require('dotenv').config();

const sequelize = new Sequelize(String(process.env.DB_NAME), String(process.env.DB_USER), String(process.env.DB_PASS), {
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    host: process.env.DB_HOST,
    port: 3306,
    timezone: "-03:00", // horário de Brasília
    pool: {
      max: 5,          // ✅ Reduzido de 20 para 5
      min: 2,          // ✅ Reduzido de 5 para 2
      acquire: 30000,  // ✅ Reduzido de 60s para 30s
      idle: 600000,    // ✅ Aumentado de 10s para 10 minutos
      evict: 60000     // ✅ Verifica conexões inativas a cada 1 minuto
    },
    logging: false, // opcional: desativa logs de SQL no console
    retry: {
      max: 3           // ✅ Tenta reconectar até 3 vezes
    }
});

export default sequelize;
