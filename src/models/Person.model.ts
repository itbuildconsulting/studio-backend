import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';

// Definir atributos do modelo
interface PersonAttributes {
  id?: number;
  name: string;
  identity: string;
  email: string;
  phone?: string;
  birthday: Date;
  active: number;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
  height?: number;
  weight?: number;
  other?: string;
  password: string;
  rule?: string;
  frequency?: string;
  employee: number;
  employee_level?: string;
}

// Definir atributos opcionais para criação
interface PersonCreationAttributes extends Optional<PersonAttributes, 'id' | 'phone' | 'address' | 'zipCode' | 'city' | 'state' | 'country' | 'height' | 'weight' | 'other' | 'rule' | 'frequency' | 'employee_level'> {}

// Criar a classe do modelo
class Person extends Model<PersonAttributes, PersonCreationAttributes> implements PersonAttributes {
  public id!: number;
  public name!: string;
  public identity!: string;
  public email!: string;
  public phone?: string;
  public birthday!: Date;
  public active!: number;
  public address?: string;
  public zipCode?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public height?: number;
  public weight?: number;
  public other?: string;
  public password!: string;
  public rule?: string;
  public frequency?: string;
  public employee!: number;
  public employee_level?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inicializar o modelo
Person.init(
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
    identity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    other: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rule: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    employee: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employee_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'persons',
    hooks: {
      beforeCreate: async (person: Person) => {
        const hashedPassword = await bcrypt.hash(person.password, 10);
        person.password = hashedPassword;
      },
    },
  }
);


export default Person;
