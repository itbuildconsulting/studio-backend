import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import Person from '../../models/Person.model';

// Points to the view `crm_class_students` which aliases studentId → user_id
// and exposes checkin_at. View is created by initCrm().
class CrmClassStudent extends Model {}

CrmClassStudent.init(
  {
    id:         { type: DataTypes.INTEGER, primaryKey: true },
    classId:    { type: DataTypes.INTEGER },
    user_id:    { type: DataTypes.INTEGER },
    checkin:    { type: DataTypes.INTEGER },
    checkin_at: { type: DataTypes.DATE },
    class_date: { type: DataTypes.DATEONLY },
  },
  { sequelize, tableName: 'crm_class_students', timestamps: true },
);

CrmClassStudent.belongsTo(Person, { as: 'student', foreignKey: 'user_id' });

export default CrmClassStudent;
