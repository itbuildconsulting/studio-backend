import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Definimos os atributos do modelo Place
interface PlaceAttributes {
  id: number;
  name: string;
  address: string;
  active: number;
}

// Definimos os atributos que são opcionais ao criar um novo local (ID é gerado automaticamente)
interface PlaceCreationAttributes extends Optional<PlaceAttributes, 'id'> {}

// Definimos a classe do modelo Place
class Place extends Model<PlaceAttributes, PlaceCreationAttributes> implements PlaceAttributes {
  public id!: number;
  public name!: string;
  public address!: string;
  public active!: number;

  // Campos padrão de data do Sequelize
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inicializamos o modelo Place
Place.init(
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
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize, // Conexão com o banco de dados
    tableName: 'place', // Nome da tabela
    timestamps: true,   // Gera automaticamente os campos createdAt e updatedAt
  }
);

export default Place;
