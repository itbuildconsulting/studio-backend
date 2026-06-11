import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import EmailTemplate from './EmailTemplate.model';

interface AutomationRuleAttributes {
  id: number;
  name: string;
  description?: string | null;
  trigger_type: 'welcome' | 'plan_expiring' | 'credits_low' | 'student_inactive' | 'birthday' | 'post_class' | 'win_back';
  trigger_config?: string | null;
  template_id: number;
  delay_value: number;
  delay_unit: 'minutes' | 'hours' | 'days';
  push_title?: string | null;
  push_body?: string | null;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<AutomationRuleAttributes, 'id' | 'description' | 'trigger_config' | 'delay_value' | 'delay_unit' | 'push_title' | 'push_body' | 'active'>;

class AutomationRule extends Model<AutomationRuleAttributes, Creation> implements AutomationRuleAttributes {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare trigger_type: AutomationRuleAttributes['trigger_type'];
  declare trigger_config: string | null;
  declare template_id: number;
  declare delay_value: number;
  declare delay_unit: 'minutes' | 'hours' | 'days';
  declare push_title: string | null;
  declare push_body: string | null;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AutomationRule.init(
  {
    id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name:           { type: DataTypes.STRING, allowNull: false },
    description:    { type: DataTypes.TEXT, allowNull: true },
    trigger_type:   { type: DataTypes.ENUM('welcome', 'plan_expiring', 'credits_low', 'student_inactive', 'birthday', 'post_class', 'win_back'), allowNull: false },
    trigger_config: { type: DataTypes.TEXT, allowNull: true },
    template_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    delay_value:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    delay_unit:     { type: DataTypes.ENUM('minutes', 'hours', 'days'), allowNull: false, defaultValue: 'hours' },
    push_title:     { type: DataTypes.STRING, allowNull: true },
    push_body:      { type: DataTypes.STRING, allowNull: true },
    active:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'automation_rules' },
);

AutomationRule.belongsTo(EmailTemplate, { as: 'template', foreignKey: 'template_id' });

export default AutomationRule;
