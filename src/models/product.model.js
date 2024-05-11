const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    dialect: 'mysql', // Or your dialect (e.g., 'postgres')
    host: 'localhost', // Optional, defaults to localhost
    port: 3306, // Optional, defaults to MySQL default port
    // Other Sequelize options...
  });

const ProductType = require('./productType.model.js');
const Place = require('./place.model.js');

const Product = sequelize.define('product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cost: {
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
