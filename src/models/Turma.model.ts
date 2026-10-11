import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TurmaAttributes {
  id?: number;
  name: string;
  teacherId: number;
  productTypeId: number;
  limit: number;
  active: boolean;
}

interface TurmaCreationAttributes extends Optional<TurmaAttributes, 'id'> {}

class Turma extends Model<TurmaAttributes, TurmaCreationAttributes> implements TurmaAttributes {
  public id!: number;
  public name!: string;
  public teacherId!: number;
  public productTypeId!: number;
  public limit!: number;
  public active!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Turma.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'turmas',
  }
);

export default Turma;
