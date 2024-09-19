const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const Balance = sequelize.define('balance', {
    idCustomer: {
      type: DataTypes.STRING, 
      primaryKey: true,
      allowNull: false
    },
    balance: {
      type: DataTypes.INTEGER,  
      allowNull: false,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW  // Data e hora da última atualização
    }
  }, {
    tableName: 'balances'  // Nome da tabela
  });
  
  // Certifique-se de sincronizar o modelo com o banco de dados
  //Balance.sync({ alter: true });


  module.exports = Balance;