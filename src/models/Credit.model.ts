import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Credit extends Model {
  public id!: number;
  public idCustomer!: number;
  public availableCredits!: number;  // Crédits disponíveis
  public usedCredits!: number;       // Créditos já usados
  public status!: string;            // Status do crédito: 'valid', 'used', 'expired'
  public expirationDate!: Date;     // Data de validade do crédito
  public creditBatch!: string;      // Lote de créditos (por exemplo, ID da transação)
  public origin?: string;           // Origem do crédito (compra, bônus, etc.)
  public lastUpdated?: Date;           // Origem do crédito (compra, bônus, etc.)

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Credit.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    idCustomer: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    productTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'Tipo de produto ao qual os créditos pertencem',
    },
    availableCredits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Créditos disponíveis inicialmente
    },
    usedCredits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Nenhum crédito usado inicialmente
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'valid', // O crédito começa com status válido
      comment: 'Status do crédito: valid, used, expired',
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    creditBatch: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Lote de créditos (ex: ID da transação)',
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Origem do crédito: compra, bônus, manual, etc.',
    },
  },
  {
    tableName: 'credits',
    sequelize, // Conexão com o banco
    indexes: [
      {
        fields: ['idCustomer'], // Facilita busca por todos os créditos de um usuário
      },
      {
        fields: ['expirationDate'], // Facilita busca por créditos próximos à expiração
      },
      {
        fields: ['status'], // Facilita busca por status do crédito
      },
    ],
  }
);

export default Credit;
