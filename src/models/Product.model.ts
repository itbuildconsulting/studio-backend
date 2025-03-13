import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import ProductType from './ProductType.model'; // Importa o modelo ProductType
import Place from './Place.model'; // Importa o modelo Place

// Definição dos atributos do modelo Product
interface ProductAttributes {
  id: number;
  name: string;
  credit: number;
  validateDate: number;
  value: number;
  active: number;
  productTypeId: number; // Relacionamento com ProductType
  purchaseLimit: number;
}

// Definição dos atributos opcionais ao criar um novo Product
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

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
        model: ProductType, // Relacionamento com ProductType
        key: 'id',
      },
    },
    purchaseLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 significa sem limite, 1 significa que pode ser comprado apenas uma vez
    },
  },
  {
    sequelize,
    tableName: 'product',
    timestamps: true, // Habilita createdAt e updatedAt
  }
);

// Configurando as associações
Product.belongsTo(ProductType, { foreignKey: 'productTypeId', as: 'productType' });-  
Product.belongsTo(Place, { foreignKey: 'placeId', as: 'place' });
//Product.sync({ alter: true });

export default Product;
