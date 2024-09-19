const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const Transactions = sequelize.define('transactions', {
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.INTEGER, // 1 PARA CRÉDITO E 2 PARA DÉBITO
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    transactionCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    balance: {
      type: DataTypes.INTEGER,  // Permite valores decimais para saldo, como 1000.50
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payment_method:{
      type: DataTypes.STRING,
      allowNull: false
    },
    closed: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerDocument: {
      type: DataTypes.STRING,
      allowNull: false
    },
    //////////
    createdAt: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    closedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    //////////
  
  
  }, {tableName: 'transactions'});
  

  //Transactions.sync({ alter: true });

module.exports = Transactions;
