// src/models/ParQ.model.ts ou src/models/Parq.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface ParQAttributes {
  id: number;
  studentId: number;
  question1: boolean;
  question2: boolean;
  question3: boolean;
  question4: boolean;
  question5: boolean;
  question6: boolean;
  question7: boolean;
  signedTerm: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class ParQ extends Model<ParQAttributes> implements ParQAttributes {
  public id!: number;
  public studentId!: number;
  public question1!: boolean;
  public question2!: boolean;
  public question3!: boolean;
  public question4!: boolean;
  public question5!: boolean;
  public question6!: boolean;
  public question7!: boolean;
  public signedTerm!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ParQ.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      // ✅ MAPEAR para o nome correto da coluna
      field: 'studentId',
    },
    question1: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    question2: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    question3: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    question4: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    question5: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    question6: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    question7: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    signedTerm: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'signedTerm',
    },
  },
  {
    sequelize,
    tableName: 'parq',
    timestamps: true,
    // ✅ IMPORTANTE: Não converter para snake_case
    underscored: false,
  }
);

export default ParQ;