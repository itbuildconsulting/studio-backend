const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../core/db/database.js');

const Person = sequelize.define('Person', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  weight: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  other: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rule: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {
  hooks: {
    beforeCreate: async (person) => {
      // Hash da senha antes de salvar no banco de dados
      const hashedPassword = await bcrypt.hash(person.password, 10);
      
      person.password = hashedPassword;
    }
  }}, {tableName: 'persons'});

module.exports = Person;
