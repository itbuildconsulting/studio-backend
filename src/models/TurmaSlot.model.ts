import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Turma from './Turma.model';

// diaSemana: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
interface TurmaSlotAttributes {
  id?: number;
  turmaId: number;
  diaSemana: number;
  horarioInicio: string; // HH:mm
  horarioFim: string;    // HH:mm
}

interface TurmaSlotCreationAttributes extends Optional<TurmaSlotAttributes, 'id'> {}

class TurmaSlot extends Model<TurmaSlotAttributes, TurmaSlotCreationAttributes> implements TurmaSlotAttributes {
  public id!: number;
  public turmaId!: number;
  public diaSemana!: number;
  public horarioInicio!: string;
  public horarioFim!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TurmaSlot.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    turmaId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Turma, key: 'id' },
    },
    diaSemana: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    horarioInicio: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    horarioFim: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'turma_slots',
  }
);

TurmaSlot.belongsTo(Turma, { foreignKey: 'turmaId', as: 'turma' });
Turma.hasMany(TurmaSlot, { foreignKey: 'turmaId', as: 'slots' });

export default TurmaSlot;
