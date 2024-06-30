const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const ProductType = require('./productType.model.js');
const Place = require('./place.model.js');

const Product = sequelize.define('product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  credit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  validateDate: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {tableName: 'product'});

Product.belongsTo(ProductType, { foreignKey: 'productTypeId' });
Product.belongsTo(Place, { foreignKey: 'placeId' });

module.exports = Product;
