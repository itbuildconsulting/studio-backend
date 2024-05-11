const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    dialect: 'mysql', // Or your dialect (e.g., 'postgres')
    host: 'localhost', // Optional, defaults to localhost
    port: 3306, // Optional, defaults to MySQL default port
    // Other Sequelize options...
  });

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

Class.belongsTo(Product, { foreignKey: 'personId' });


module.exports = Product;
