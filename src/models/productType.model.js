const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const ProductType = sequelize.define('productType', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  placeId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {tableName: 'productType'});

module.exports = ProductType;
