import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database'; // Conexão com o banco de dados

// Interface que define os atributos do modelo
interface TransactionAttributes {
  status: string;
  transactionType: number;
  transactionId: string;
  transactionCode: string;
  balance: number;
  amount: number;
  currency: string;
  payment_method: string;
  closed: boolean;
  customerId: string;
  studentId: number;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  discountType: number;
  discountPercent: number;
  discountAmount: number;
  closedAt: Date;
}

// Interface opcional para criação parcial (atributos opcionais)
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'transactionId'> {}

// Classe que representa o modelo de transações
class Transactions extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public status!: string;
  public transactionType!: number;
  public transactionId!: string;
  public transactionCode!: string;
  public balance!: number;
  public amount!: number;
  public currency!: string;
  public payment_method!: string;
  public closed!: boolean;
  public customerId!: string;
  public studentId!: number;
  public customerName!: string;
  public customerEmail!: string;
  public customerDocument!: string;
  public discountType!: number;
  public discountPercent!: number;
  public discountAmount!: number;
  public closedAt!: Date;

  // Timestamps
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Definição do modelo
Transactions.init({
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  transactionType: {
    type: DataTypes.INTEGER, // 1 PARA CRÉDITO E 2 PARA DÉBITO
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  transactionCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  balance: {
    type: DataTypes.INTEGER,  // Permite valores decimais para saldo
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  closed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerDocument: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  discountType: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  discountPercent: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  discountAmount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'transactions',
  timestamps: true,  // Inclui os campos createdAt e updatedAt automaticamente
});

//Transactions.sync({ alter: true });

export default Transactions;
