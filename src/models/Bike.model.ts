import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import ClassA from './Class.model';

// Definir os atributos da bike
interface BikeAttributes {
  id: number;
  bikeNumber: number;
  status: string;  // 'available', 'maintenance', 'in_use', etc.
  studentId?: number | null;  // Aluno associado à bike, pode ser null
  classId?: number | null;    // Aula associada à bike, pode ser null
}

// Atributos necessários apenas na criação (id será auto-incrementado)
interface BikeCreationAttributes extends Optional<BikeAttributes, 'id'> {}

// Definir o modelo de Bike
class Bike extends Model<BikeAttributes, BikeCreationAttributes> implements BikeAttributes {
  public id!: number;
  public bikeNumber!: number;
  public status!: string;
  public studentId!: number | null;
  public classId!: number | null;

  // Timestamps padrão do Sequelize
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inicialização do modelo `Bike`
Bike.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bikeNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'available',
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: ClassA,  // Referencia o modelo Class
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'bikes',
    timestamps: true,
  }
);

// Relacionamento com o modelo `Class`
Bike.belongsTo(ClassA, { foreignKey: 'classId'});
//Bike.sync({ alter: true });

export default Bike;