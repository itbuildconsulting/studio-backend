import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import ProductType from './ProductType.model';
import Place from './Place.model';

class Product extends Model {
    public id!: number;
    public name!: string;
    public credit!: number;
    public validateDate!: number;
    public value!: number;
    public active!: number;
    public productTypeId!: number;
    public purchaseLimit!: number;
    public placeId?: number;
    
    // ⬇️ ADICIONE ESTAS LINHAS
    public usageRestrictionType!: 'none' | 'weekly' | 'monthly' | 'lifetime';
    public usageRestrictionLimit?: number | null;
    public requiredLevel?: number | null;
    public exclusiveLevels?: any; // ou string[] se você quiser tipar o JSON
    
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Product.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        credit: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        validateDate: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        active: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productTypeId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        purchaseLimit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        placeId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        // ⬇️ ADICIONE ESTES CAMPOS
        usageRestrictionType: {
            type: DataTypes.ENUM('none', 'weekly', 'monthly', 'lifetime'),
            allowNull: false,
            defaultValue: 'none',
            comment: 'Tipo de restrição de uso: none (ilimitado), weekly (semanal), monthly (mensal), lifetime (vitalício)'
        },
        usageRestrictionLimit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            comment: 'Quantidade máxima de uso no período definido. NULL = ilimitado'
        },
        requiredLevel: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            comment: 'Nível mínimo necessário para comprar este produto'
        },
        exclusiveLevels: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Array de IDs de níveis que têm acesso exclusivo a este produto'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'product',
        timestamps: true,
    }
);

// Configurando as associações
Product.belongsTo(ProductType, { foreignKey: 'productTypeId', as: 'productType' });
Product.belongsTo(Place, { foreignKey: 'placeId', as: 'place' });

export default Product;