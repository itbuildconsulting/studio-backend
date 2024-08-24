const sequelize = require('../core/db/database.js');

const Balance = sequelize.define('balance', {
    idCustomer: {
      type: DataTypes.STRING,  // Assumindo que o ID do cliente é uma string
      primaryKey: true,
      allowNull: false
    },
    saldo: {
      type: DataTypes.DECIMAL(10, 2),  // Permite valores decimais para saldo, como 1000.50
      allowNull: false,
      defaultValue: 0.00  // Começa com saldo zero
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW  // Data e hora da última atualização
    }
  }, {
    tableName: 'balances'  // Nome da tabela
  });
  
  // Certifique-se de sincronizar o modelo com o banco de dados
  Balance.sync({ alter: true });