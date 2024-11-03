import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface que define os atributos do modelo
interface BalanceAttributes {
  idCustomer: number;
  balance: number;
  lastUpdated: Date;
}

// Interface opcional para criação (atributos opcionais durante a criação)
interface BalanceCreationAttributes extends Optional<BalanceAttributes, 'lastUpdated'> {}

// Definindo a classe Balance que estende o Model do Sequelize
class Balance extends Model<BalanceAttributes, BalanceCreationAttributes> implements BalanceAttributes {
  public idCustomer!: number;
  public balance!: number;
  public lastUpdated!: Date;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Definição do modelo Balance
Balance.init({
  idCustomer: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW  // Data e hora da última atualização
  }
}, {
  sequelize,
  tableName: 'balances',  // Nome da tabela
  timestamps: true,  // Caso tenha colunas createdAt e updatedAt
});

//Balance.sync({ alter: true });

export default Balance;
