// src/models/ContractVersion.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ContractVersionAttributes {
  id: number;
  version: string;
  title: string;
  content: string;
  active: boolean;
  effectiveDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number | null;
}

interface ContractVersionCreationAttributes
  extends Optional<ContractVersionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {}

class ContractVersion
  extends Model<ContractVersionAttributes, ContractVersionCreationAttributes>
  implements ContractVersionAttributes
{
  public id!: number;
  public version!: string;
  public title!: string;
  public content!: string;
  public active!: boolean;
  public effectiveDate!: Date;
  public createdBy?: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContractVersion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'effective_date',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    tableName: 'contract_versions',
    timestamps: true,
    underscored: true,
  }
);

export default ContractVersion;