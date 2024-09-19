const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const Items = sequelize.define('item', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    itemId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'transactionId'
      }
    },
    itemCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    balance: {
      type: DataTypes.INTEGER,  
      allowNull: false,
      defaultValue: 0  // Começa com saldo zero
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE

  }, { tableName: 'items' });
  
    // Certifique-se de sincronizar o modelo com o banco de dados
    //Items.sync({ alter: true });

  module.exports = Items;