import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import ProductType from './ProductType.model';

// Definindo a interface dos atributos
interface ClassAttributes {
  id?: number;
  date: string;
  time: string;
  teacherId: number;
  limit: number;
  hasCommission: boolean;
  kickbackRule?: string;
  kickback?: number;
  active: boolean;
  productTypeId: number;
}

// Interface para criação de novos registros, onde o campo `id` é opcional
interface ClassCreationAttributes extends Optional<ClassAttributes, 'id'> {}

// Definindo o modelo `Class`
class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  public id!: number;
  public date!: string;
  public time!: string;
  public teacherId!: number;
  public limit!: number;
  public hasCommission!: boolean;
  public kickbackRule?: string;
  public kickback?: number;
  public active!: boolean;
  public productTypeId!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inicializando o modelo
Class.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hasCommission: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    kickbackRule: {
      type: DataTypes.STRING,
    },
    kickback: {
      type: DataTypes.DECIMAL,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    productTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: ProductType,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'class',
  }
);

// Definindo a associação
Class.belongsTo(ProductType, { foreignKey: 'productTypeId' });

//Class.sync({ alter: true });

export default Class;
