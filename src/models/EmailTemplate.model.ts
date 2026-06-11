import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmailTemplateAttributes {
  id: number;
  name: string;
  description?: string | null;
  subject: string;
  body_html: string;
  category: 'retention' | 'engagement' | 'revenue' | 'transactional';
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<EmailTemplateAttributes, 'id' | 'description' | 'active'>;

class EmailTemplate extends Model<EmailTemplateAttributes, Creation> implements EmailTemplateAttributes {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare subject: string;
  declare body_html: string;
  declare category: 'retention' | 'engagement' | 'revenue' | 'transactional';
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EmailTemplate.init(
  {
    id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name:        { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    subject:     { type: DataTypes.STRING, allowNull: false },
    body_html:   { type: DataTypes.TEXT('long'), allowNull: false },
    category:    { type: DataTypes.ENUM('retention', 'engagement', 'revenue', 'transactional'), allowNull: false },
    active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'email_templates' },
);

export default EmailTemplate;
