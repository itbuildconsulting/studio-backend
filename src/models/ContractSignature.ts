// src/models/ContractSignature.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ContractSignatureAttributes {
  id: number;
  studentId: number;
  contractVersionId: number;
  signedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  studentName: string;
  studentCpf: string;
  studentEmail: string;
  studentBirthDate?: Date | null;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedImageUse: boolean;
  acceptedDataProcessing: boolean;
  active: boolean;
  revokedAt?: Date | null;
  revokedReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContractSignatureCreationAttributes
  extends Optional<
    ContractSignatureAttributes,
    | 'id'
    | 'signedAt'
    | 'ipAddress'
    | 'userAgent'
    | 'studentBirthDate'
    | 'acceptedTerms'
    | 'acceptedPrivacy'
    | 'acceptedImageUse'
    | 'acceptedDataProcessing'
    | 'active'
    | 'revokedAt'
    | 'revokedReason'
    | 'createdAt'
    | 'updatedAt'
  > {}

class ContractSignature
  extends Model<ContractSignatureAttributes, ContractSignatureCreationAttributes>
  implements ContractSignatureAttributes
{
  public id!: number;
  public studentId!: number;
  public contractVersionId!: number;
  public signedAt!: Date;
  public ipAddress?: string | null;
  public userAgent?: string | null;
  public studentName!: string;
  public studentCpf!: string;
  public studentEmail!: string;
  public studentBirthDate?: Date | null;
  public acceptedTerms!: boolean;
  public acceptedPrivacy!: boolean;
  public acceptedImageUse!: boolean;
  public acceptedDataProcessing!: boolean;
  public active!: boolean;
  public revokedAt?: Date | null;
  public revokedReason?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContractSignature.init(
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
    contractVersionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'contract_version_id',
      references: {
        model: 'contract_versions',
        key: 'id',
      },
    },
    signedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'signed_at',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    studentName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'student_name',
    },
    studentCpf: {
      type: DataTypes.STRING(14),
      allowNull: false,
      field: 'student_cpf',
    },
    studentEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'student_email',
    },
    studentBirthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'student_birth_date',
    },
    acceptedTerms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'accepted_terms',
    },
    acceptedPrivacy: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'accepted_privacy',
    },
    acceptedImageUse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'accepted_image_use',
    },
    acceptedDataProcessing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'accepted_data_processing',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at',
    },
    revokedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'revoked_reason',
    },
  },
  {
    sequelize,
    tableName: 'contract_signatures',
    timestamps: true,
    underscored: true,
  }
);

export default ContractSignature;