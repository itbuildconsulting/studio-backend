// src/models/ContractVersion.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface ContractVersionAttributes {
  id: number;
  version: string;
  content: string;
  active: boolean;
  effective_date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class ContractVersion extends Model<ContractVersionAttributes> implements ContractVersionAttributes {
  public id!: number;
  public version!: string;
  public content!: string;
  public active!: boolean;
  public effective_date!: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContractVersion.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    effective_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'contract_versions',
    timestamps: true,
    // ✅ IMPORTANTE: Não converter para snake_case
    underscored: false,
  }
);

export default ContractVersion;