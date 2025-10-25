import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Se você usa um arquivo index.ts que exporta sequelize, importe dele.

export interface OtpCodeAttributes {
  id: number;
  user_id: number;
  purpose: 'signup';
  code_hash: string;
  expires_at: Date;
  attempts: number;
  created_at?: Date;
  updated_at?: Date | null;
}
type OtpCodeCreation = Optional<OtpCodeAttributes, 'id' | 'attempts' | 'created_at' | 'updated_at'>;

class OtpCode extends Model<OtpCodeAttributes, OtpCodeCreation>
  implements OtpCodeAttributes {
  public id!: number;
  public user_id!: number;
  public purpose!: 'signup';
  public code_hash!: string;
  public expires_at!: Date;
  public attempts!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date | null;
}

OtpCode.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    purpose: { type: DataTypes.STRING(32), allowNull: false },
    code_hash: { type: DataTypes.STRING(120), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'OtpCode',
    tableName: 'otp_codes',
    underscored: true,       // para usar expires_at, created_at etc.
    timestamps: true,        // created_at/updated_at
  }
);


export default OtpCode;