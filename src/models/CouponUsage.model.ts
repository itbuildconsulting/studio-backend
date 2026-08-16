import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Coupon from './Coupon.model';

class CouponUsage extends Model {
    public id!: number;
    public couponId!: number;
    public studentId!: number;
    public transactionId!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CouponUsage.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        couponId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: Coupon, key: 'id' } },
        studentId: { type: DataTypes.INTEGER, allowNull: false },
        transactionId: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'coupon_usages' }
);

CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId' });

export default CouponUsage;
