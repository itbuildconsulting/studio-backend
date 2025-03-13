import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database'; // O caminho para o seu sequelize config

// Interface que descreve os atributos de um nível
interface LevelAttributes {
  id: number;
  name: string;
  numberOfClasses: number;
  title: string;
  benefit: string;
  color: string;
  antecedence: number;  // Campo de antecedência (em dias)
}

// Interface para criação de um novo nível (sem o campo `id`, pois é auto-incrementado)
interface LevelCreationAttributes extends Omit<LevelAttributes, 'id'> {}

class Level extends Model<LevelAttributes, LevelCreationAttributes> implements LevelAttributes {
  public id!: number;
  public name!: string;
  public numberOfClasses!: number;
  public title!: string;
  public benefit!: string;
  public color!: string;
  public antecedence!: number;  // Adicionando o campo de antecedência

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Criando o modelo Level
Level.init(
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
    numberOfClasses: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    benefit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,  
    },
    antecedence: {
        type: DataTypes.INTEGER, // A antecedência será um número de dias
        allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'levels',  // Nome da tabela no banco
  }
);

//Level.sync({ alter: true });

export default Level;
