import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Credit extends Model {
  public id!: number;
  public idCustomer!: number;
  public expirationDate!: Date;
  public used!: boolean;
  public origin?: string; // opcional, se quiser controlar a origem do crédito (ex: compra, bônus, etc.)
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
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Origem do crédito: compra, bônus, manual, etc.'
    },
  },
  {
    tableName: 'credits',
    sequelize, // conexão
    timestamps: true, // createdAt, updatedAt
    indexes: [
      {
        fields: ['idCustomer'], // facilita buscar todos créditos de um aluno
      },
      {
        fields: ['expirationDate'], // facilita buscar créditos que vencem
      },
      {
        fields: ['used'], // facilita buscar apenas créditos não usados
      },
    ],
  }
);

export default Credit;
