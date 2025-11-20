// src/models/ContractSignature.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import ContractVersion from './ContractVersion';

interface ContractSignatureAttributes {
  id: number;
  studentId: number;
  contractVersionId: number;
  signed_at: Date;
  ipAddress?: string;
  userAgent?: string;
  studentName: string;
  studentCpf?: string;
  studentEmail?: string;
  studentBirthDate?: Date;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedImageUse: boolean;
  acceptedDataProcessing: boolean;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class ContractSignature extends Model<ContractSignatureAttributes> implements ContractSignatureAttributes {
  public id!: number;
  public studentId!: number;
  public contractVersionId!: number;
  public signed_at!: Date;
  public ipAddress!: string;
  public userAgent!: string;
  public studentName!: string;
  public studentCpf!: string;
  public studentEmail!: string;
  public studentBirthDate!: Date;
  public acceptedTerms!: boolean;
  public acceptedPrivacy!: boolean;
  public acceptedImageUse!: boolean;
  public acceptedDataProcessing!: boolean;
  public active!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContractSignature.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      // ✅ MAPEAR para o nome correto da coluna
      field: 'studentId',
    },
    contractVersionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      // ✅ MAPEAR para o nome correto da coluna
      field: 'contractVersionId',
    },
    signed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ipAddress',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'userAgent',
    },
    studentName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'studentName',
    },
    studentCpf: {
      type: DataTypes.STRING(14),
      allowNull: true,
      field: 'studentCpf',
    },
    studentEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'studentEmail',
    },
    studentBirthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'studentBirthDate',
    },
    acceptedTerms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'acceptedTerms',
    },
    acceptedPrivacy: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'acceptedPrivacy',
    },
    acceptedImageUse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'acceptedImageUse',
    },
    acceptedDataProcessing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'acceptedDataProcessing',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'contract_signatures',
    timestamps: true,
    // ✅ IMPORTANTE: Não converter para snake_case
    underscored: false,
  }
);

// Relacionamento com ContractVersion
ContractSignature.belongsTo(ContractVersion, {
  foreignKey: 'contractVersionId',
  as: 'contractVersion',
});

export default ContractSignature;