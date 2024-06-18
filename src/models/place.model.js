const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../core/db/database.js');

const Place = sequelize.define('place', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {tableName: 'place'});

module.exports = Place;
