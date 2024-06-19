const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');
const Place = require('./place.model.js');

const ProductType = sequelize.define('productType', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {tableName: 'productType'});

ProductType.belongsTo(Place, { foreignKey: 'placeId' });

module.exports = ProductType;
