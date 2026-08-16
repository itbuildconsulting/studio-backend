import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Coupon extends Model {
    public id!: number;
    public code!: string;
    public type!: 'percent' | 'fixed';
    public value!: number;
    public active!: boolean;
    public expiresAt!: Date | null;
    public maxUses!: number | null;
    public maxUsesPerStudent!: number;
    public productIds!: string | null; // JSON array de IDs, null = todos
    public usedCount!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Coupon.init(
    {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        type: { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false },
        value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        expiresAt: { type: DataTypes.DATE, allowNull: true },
        maxUses: { type: DataTypes.INTEGER, allowNull: true },
        maxUsesPerStudent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        productIds: { type: DataTypes.TEXT, allowNull: true },
        usedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { sequelize, tableName: 'coupons' }
);

export default Coupon;
