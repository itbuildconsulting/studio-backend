const sequelize = require('../core/db/database.js');

const Items = sequelize.define('item', {
    itemId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'transactionId'
      }
    },
    itemCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { tableName: 'items' });
  