import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import ProductType from './ProductType.model';
import Place from './Place.model';

// Definição dos atributos do modelo Product
interface ProductAttributes {
  id: number;
  name: string;
  credit: number;
  validateDate: number;
  value: number;
  active: number;
  productTypeId: number;
  purchaseLimit: number;                      // 🆕 Limite de compras por aluno
  requiredLevel?: number | null;              // Nível mínimo necessário
  exclusiveLevels?: number[] | null;          // Array de níveis com acesso exclusivo
}

// Definição dos atributos opcionais ao criar um novo Product
interface ProductCreationAttributes extends Optional<
  ProductAttributes, 
  'id' | 'purchaseLimit' | 'requiredLevel' | 'exclusiveLevels'
> {}

// Definindo a classe Product que estende o Model do Sequelize
class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public credit!: number;
  public validateDate!: number;
  public value!: number;
  public active!: number;
  public productTypeId!: number;
  public purchaseLimit!: number;
  public requiredLevel?: number | null;
  public exclusiveLevels?: number[] | null;

  // Timestamps do Sequelize (createdAt, updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inicializando o modelo Product
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
      references: {
        model: ProductType,
        key: 'id',
      },
    },
    // 🆕 Limite máximo de compras por aluno
    purchaseLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'DEPRECADO - usar maxPurchase',
    },    
    // Nível mínimo necessário para ver/comprar o produto
    requiredLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Nível mínimo necessário (NULL = todos podem ver)',
    },
    // Array de IDs de níveis com acesso exclusivo
    exclusiveLevels: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Array de IDs de níveis com acesso exclusivo (NULL = sem restrição)',
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