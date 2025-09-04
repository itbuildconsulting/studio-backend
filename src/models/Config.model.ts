import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Config extends Model {
  public id!: number;
  public configKey!: string; // Ex: "productTypesVisible", "paymentCancellationTime", "classCancellationTime"
  public configValue!: string; // O valor da configuração (pode ser um JSON ou um valor simples)
  public description?: string; // Uma descrição opcional sobre o que a configuração faz
  public active!: number;
}

Config.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    configKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    configValue: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'configurations',
    sequelize, // Conexão com o banco de dados
    timestamps: false, // Não precisamos de createdAt ou updatedAt para configurações
  }
);

Config.sync({ alter: true });

export default Config;
