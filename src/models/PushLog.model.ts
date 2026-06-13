import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PushLogAttributes {
  id: number;
  title: string;
  body: string;
  recipient_count: number;
  sent_count: number;
  disabled_count: number;
  person_ids: string;
  status: 'sent' | 'partial' | 'failed';
  error_message?: string | null;
  sent_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<PushLogAttributes, 'id' | 'disabled_count' | 'status' | 'error_message' | 'sent_at'>;

class PushLog extends Model<PushLogAttributes, Creation> implements PushLogAttributes {
  declare id: number;
  declare title: string;
  declare body: string;
  declare recipient_count: number;
  declare sent_count: number;
  declare disabled_count: number;
  declare person_ids: string;
  declare status: 'sent' | 'partial' | 'failed';
  declare error_message: string | null;
  declare sent_at: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PushLog.init(
  {
    id:              { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title:           { type: DataTypes.STRING, allowNull: false },
    body:            { type: DataTypes.TEXT, allowNull: false },
    recipient_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    sent_count:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    disabled_count:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    person_ids:      { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
    status:          { type: DataTypes.ENUM('sent', 'partial', 'failed'), allowNull: false, defaultValue: 'sent' },
    error_message:   { type: DataTypes.STRING(500), allowNull: true },
    sent_at:         { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'push_logs',
    indexes: [{ fields: ['sent_at'] }, { fields: ['status'] }],
  },
);

export default PushLog;
