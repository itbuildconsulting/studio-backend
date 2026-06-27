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
  header_color?: string | null;
  header_logo_url?: string | null;
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
  declare header_color: string | null;
  declare header_logo_url: string | null;
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
    header_color:    { type: DataTypes.STRING, allowNull: true },
    header_logo_url: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: 'email_templates' },
);

export default EmailTemplate;
