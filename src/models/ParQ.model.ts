// src/models/ParQ.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ParQAttributes {
  id: number;
  studentId: number;
  question1: boolean; // Problema de coração
  question2: boolean; // Dores no peito ao praticar
  question3: boolean; // Dores no peito no último mês
  question4: boolean; // Desequilíbrio/tontura
  question5: boolean; // Problema ósseo ou articular
  question6: boolean; // Medicamento para pressão/coração
  question7: boolean; // Outra razão
  hasRisk?: boolean;  // Campo calculado
  signedTerm: boolean;
  termDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParQCreationAttributes extends Optional<ParQAttributes, 'id' | 'hasRisk' | 'createdAt' | 'updatedAt'> {}

class ParQ extends Model<ParQAttributes, ParQCreationAttributes> implements ParQAttributes {
  public id!: number;
  public studentId!: number;
  public question1!: boolean;
  public question2!: boolean;
  public question3!: boolean;
  public question4!: boolean;
  public question5!: boolean;
  public question6!: boolean;
  public question7!: boolean;
  public hasRisk?: boolean;
  public signedTerm!: boolean;
  public termDate?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ParQ.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id',
      references: {
        model: 'person',
        key: 'id',
      },
    },
    question1: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'question_1',
    },
    question2: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'question_2',
    },
    question3: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'question_3',
    },
    question4: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'question_4',
    },
    question5: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'question_5',
    },
    question6: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'question_6',
    },
    question7: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'question_7',
    },
    hasRisk: {
      type: DataTypes.VIRTUAL,
      get() {
        return (
          this.question1 ||
          this.question2 ||
          this.question3 ||
          this.question4 ||
          this.question5 ||
          this.question6 ||
          this.question7
        );
      },
      field: 'has_risk',
    },
    signedTerm: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'signed_term',
    },
    termDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'term_date',
    },
  },
  {
    sequelize,
    tableName: 'parq',
    timestamps: true,
    underscored: true,
  }
);

export default ParQ;