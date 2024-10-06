const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const Product = require('./product.model.js');
const ProductType = require('./productType.model.js');
const Person = require('./person.model.js');

const Class = sequelize.define('class', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Persons',
      key: 'id'
    }
  },
  limit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hasCommission: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },  
  kickbackRule: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kickback: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {tableName: 'class'});

Class.belongsTo(Product, { foreignKey: 'productId' });
Class.belongsToMany(Person, { through: 'ClassStudents', as: 'students' });

module.exports = Class;
