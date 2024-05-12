const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../core/db/database.js');

const Employee = sequelize.define('Employee', {
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
  level: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
}, {
  hooks: {
    beforeCreate: async (employee) => {
      // Hash da senha antes de salvar no banco de dados
      const hashedPassword = await bcrypt.hash(employee.password, 10);
      
      employee.password = hashedPassword;
    }
  }}, {tableName: 'employee'});

module.exports = Employee;
