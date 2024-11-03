import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database'; // Conexão com o banco de dados
import Place from './Place.model'; // Importa o modelo Place

// Definição dos atributos do modelo ProductType
interface ProductTypeAttributes {
  id: number;
  name: string;
  active: number;
  placeId: number; // Relacionamento com Place
}

// Definição dos atributos opcionais ao criar um novo ProductType
interface ProductTypeCreationAttributes extends Optional<ProductTypeAttributes, 'id'> {}

// Definindo a classe ProductType que estende o Model do Sequelize
class ProductType extends Model<ProductTypeAttributes, ProductTypeCreationAttributes> implements ProductTypeAttributes {
  public id!: number;
  public name!: string;
  public active!: number;
  public placeId!: number;

  // Timestamps do Sequelize (createdAt, updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inicializando o modelo ProductType
ProductType.init(
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
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    placeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: Place, // Relacionamento com o modelo Place
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'productType',
    timestamps: true, // Habilita o createdAt e updatedAt automaticamente
  }
);

// Configurando a associação belongsTo com Place
ProductType.belongsTo(Place, { foreignKey: 'placeId', as: 'place' });

export default ProductType;
