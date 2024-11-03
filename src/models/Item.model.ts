import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface que define os atributos do modelo
interface ItemAttributes {
  id: number;
  itemId: number;
  transactionId: string;
  itemCode: string;
  description: string;
  quantity: number;
  amount: number;
  balance: number;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

// Interface opcional para criação (atributos opcionais durante a criação)
interface ItemCreationAttributes extends Optional<ItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Definindo a classe Item que estende o Model do Sequelize
class Item extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
  public id!: number;
  public itemId!: number;
  public transactionId!: string;
  public itemCode!: string;
  public description!: string;
  public quantity!: number;
  public amount!: number;
  public balance!: number;
  public status!: string;
  public created_at?: Date;
  public updated_at?: Date;
}

// Definição do modelo Item
Item.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'transactions',
      key: 'transactionId',
    },
  },
  itemCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,  // Começa com saldo zero
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  sequelize,
  tableName: 'items',
  timestamps: false,  // Se você quiser gerenciar manualmente created_at e updated_at
});

//Item.sync({ alter: true });

export default Item;
