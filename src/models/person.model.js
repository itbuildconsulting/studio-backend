const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize('studio_DB', 'studio_USER', 'studio_PASSWORD', {
    dialect: 'mysql', // Or your dialect (e.g., 'postgres')
    host: 'localhost', // Optional, defaults to localhost
    port: 3306, // Optional, defaults to MySQL default port
    // Other Sequelize options...
  });

const Person = sequelize.define('Person', {
  name: {
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
  password: {
    type: DataTypes.STRING,
    allowNull: false
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
