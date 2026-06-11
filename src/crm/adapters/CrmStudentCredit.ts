import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../../config/database';
import Person from '../../models/Person.model';

// Adapts the 'credits' table to the CrmDb.StudentCredit interface.
// Maps column names and status values used by the CRM engine.
class CrmStudentCredit extends Model {}

CrmStudentCredit.init(
  {
    id:              { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'idCustomer' },
    availableCredits:{ type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'valid',
      get() {
        const raw = this.getDataValue('status') as string;
        if (raw === 'valid') return 'active';
        if (raw === 'used')  return 'exhausted';
        return raw;
      },
      set(val: string) {
        if (val === 'active')    this.setDataValue('status', 'valid');
        else if (val === 'exhausted') this.setDataValue('status', 'used');
        else                    this.setDataValue('status', val);
      },
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expirationDate' },
  },
  { sequelize, tableName: 'credits', timestamps: true },
);

CrmStudentCredit.belongsTo(Person, { as: 'user', foreignKey: 'idCustomer' });

// Translates CRM status values (active/exhausted) to Studio DB values (valid/used)
// before each query, so WHERE clauses match the actual stored values.
function mapStatus(val: any): any {
  if (val === 'active')    return 'valid';
  if (val === 'exhausted') return 'used';
  if (Array.isArray(val))  return val.map(mapStatus);
  if (val && typeof val === 'object') {
    const out: any = {};
    for (const k of Object.getOwnPropertySymbols(val)) {
      out[k] = k === Op.in || k === Op.notIn
        ? (val[k] as any[]).map(mapStatus)
        : mapStatus(val[k]);
    }
    for (const k of Object.keys(val)) out[k] = mapStatus(val[k]);
    return out;
  }
  return val;
}

(CrmStudentCredit as any).addHook('beforeFind', (options: any) => {
  if (options.where?.status !== undefined) {
    options.where.status = mapStatus(options.where.status);
  }
});

export default CrmStudentCredit;
