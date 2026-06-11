import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Nps extends Model {
    public id!: number;
    public classId!: number;
    public studentId!: number;
    public score!: number;
    public comment?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Nps.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        classId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 0, max: 10 },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'nps',
        indexes: [
            { unique: true, fields: ['classId', 'studentId'] },
        ],
    }
);

export default Nps;
