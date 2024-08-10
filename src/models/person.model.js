const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../core/db/database.js');


const Person = sequelize.define('Person', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  identity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
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
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },    
  rule: {
    type: DataTypes.STRING,
    allowNull: true
  },
  frequency: {
    type: DataTypes.STRING,
    allowNull: true
  },  
  employee: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  employee_level: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (person) => {
      // Hash da senha antes de salvar no banco de dados
      const hashedPassword = await bcrypt.hash(person.password, 10);
      
      person.password = hashedPassword;
    }
  }}, {tableName: 'persons'});

module.exports = Person;
