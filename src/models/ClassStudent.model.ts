import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import ClassA from './Class.model';


class ClassStudent extends Model {
  public id!: number;
  public classId!: number;
  public studentId!: number | null;
  public bikeId!: number | null;
  public checkin!: number | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public status!: boolean;
  public transactionId!: string;
}

// Definindo o modelo com as associações necessárias
ClassStudent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: ClassA,
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    checkin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bikeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: 'classStudent',
    timestamps: true,
  }
);

// Definindo associações
ClassStudent.belongsTo(ClassA, { foreignKey: 'classId',});
ClassStudent.sync({ alter: true });

export default ClassStudent;
