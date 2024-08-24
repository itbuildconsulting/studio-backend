const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const Transactions = sequelize.define('product', {
    success: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transactionType: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transactionCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false
    },
    closed: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    customerId: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    customerName: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    customerEmail: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    customerDocument: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    //////////
    created_at: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    closed_at: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    //////////
  
  
  }, {tableName: 'transaction'});
  


module.exports = Transactions;
