const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    dialect: 'mysql', // Or your dialect (e.g., 'postgres')
    host: 'localhost', // Optional, defaults to localhost
    port: 3306, // Optional, defaults to MySQL default port
    // Other Sequelize options...
  });

const Product = require('./product.model.js');
const Person = require('./person.model.js');

const Class = sequelize.define('class', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  limit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  income: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  config: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kickback: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  kickbackRule: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {tableName: 'class'});

Class.belongsTo(Product, { foreignKey: 'productId' });
Class.belongsToMany(Person, { through: 'PersonClass' });
Class.belongsTo(Person, { foreignKey: 'professorId' });


module.exports = Class;
