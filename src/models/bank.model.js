const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const Person = require('./person.model.js');

const Bank = sequelize.define('bank', {
  value: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  config: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {tableName: 'bank'});

Bank.belongsTo(Person, { foreignKey: 'personId' });


module.exports = Bank;
