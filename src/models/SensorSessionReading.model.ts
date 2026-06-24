import { Model, DataTypes } from 'sequelize';
import sensorSequelize from '../config/sensorDatabase';

// Mapeia a tabela `session_readings` do banco do sensor-service (serie
// temporal de cadencia/velocidade/potencia durante a aula).
class SensorSessionReading extends Model {
  public id!: number;
  public sessionId!: number;
  public elapsedS!: number;
  public cadenceRpm!: number;
  public speedKmh!: number;
  public powerW!: number;
}

SensorSessionReading.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    sessionId: { type: DataTypes.BIGINT, field: 'session_id' },
    elapsedS: { type: DataTypes.DECIMAL(8, 1), field: 'elapsed_s' },
    cadenceRpm: { type: DataTypes.INTEGER, field: 'cadence_rpm' },
    speedKmh: { type: DataTypes.DECIMAL(5, 1), field: 'speed_kmh' },
    powerW: { type: DataTypes.INTEGER, field: 'power_w' },
  },
  {
    sequelize: sensorSequelize,
    tableName: 'session_readings',
    timestamps: false,
  }
);

export default SensorSessionReading;
