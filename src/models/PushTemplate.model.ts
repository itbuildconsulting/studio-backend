import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const PushTemplate = sequelize.define('PushTemplate', {
  id:    { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:  { type: DataTypes.STRING(100), allowNull: false },
  title: { type: DataTypes.STRING(100), allowNull: false },
  body:  { type: DataTypes.STRING(250), allowNull: false },
}, {
  tableName:  'push_templates',
  timestamps: true,
});

export default PushTemplate;
