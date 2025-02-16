import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Class from './Class.model';
import Person from './Person.model';

interface WaitingListAttributes {
  id: number;
  studentId: number;
  classId: number;
  order: number;
}

interface WaitingListCreationAttributes extends Optional<WaitingListAttributes, 'id'> {}

class WaitingList extends Model<WaitingListAttributes, WaitingListCreationAttributes> implements WaitingListAttributes {
  public id!: number;
  public studentId!: number;
  public classId!: number;
  public order!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WaitingList.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Person,
        key: 'id',
      },
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Class,
        key: 'id',
      },
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'waiting_list',
    timestamps: true,
  }
);

// Definição das associações
WaitingList.belongsTo(Person, { foreignKey: 'studentId', as: 'student' });
WaitingList.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

export default WaitingList;
