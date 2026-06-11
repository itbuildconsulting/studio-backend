import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Person from './Person.model';
import EmailTemplate from './EmailTemplate.model';

interface EmailLogAttributes {
  id: number;
  user_id?: number | null;
  rule_id?: number | null;
  template_id?: number | null;
  to_email: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'opened';
  error_message?: string | null;
  metadata?: string | null;
  sent_at?: Date | null;
  opened_at?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<EmailLogAttributes, 'id' | 'user_id' | 'rule_id' | 'template_id' | 'status' | 'error_message' | 'metadata' | 'sent_at' | 'opened_at'>;

class EmailLog extends Model<EmailLogAttributes, Creation> implements EmailLogAttributes {
  declare id: number;
  declare user_id: number | null;
  declare rule_id: number | null;
  declare template_id: number | null;
  declare to_email: string;
  declare subject: string;
  declare status: 'pending' | 'sent' | 'failed' | 'opened';
  declare error_message: string | null;
  declare metadata: string | null;
  declare sent_at: Date | null;
  declare opened_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EmailLog.init(
  {
    id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    rule_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    template_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    to_email:      { type: DataTypes.STRING, allowNull: false },
    subject:       { type: DataTypes.STRING, allowNull: false },
    status:        { type: DataTypes.ENUM('pending', 'sent', 'failed', 'opened'), allowNull: false, defaultValue: 'pending' },
    error_message: { type: DataTypes.STRING(500), allowNull: true },
    metadata:      { type: DataTypes.TEXT, allowNull: true },
    sent_at:       { type: DataTypes.DATE, allowNull: true },
    opened_at:     { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'email_logs',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['rule_id'] },
      { fields: ['status'] },
    ],
  },
);

EmailLog.belongsTo(Person,        { as: 'user',     foreignKey: 'user_id' });
EmailLog.belongsTo(EmailTemplate, { as: 'template', foreignKey: 'template_id' });

export default EmailLog;
