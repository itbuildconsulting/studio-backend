import { Model, DataTypes } from 'sequelize';
import sensorSequelize from '../config/sensorDatabase';

// Mapeia a tabela `sessions` do banco do sensor-service (somente leitura
// pelo studio-backend; quem grava e o sensor-service).
class SensorSession extends Model {
  public id!: number;
  public sensorId!: string;
  public bikeNumber!: number;
  public classId!: number;
  public studentId!: number;
  public date!: string;
  public startTime!: string;
  public endTime!: string | null;
  public distanceKm!: number;
  public elapsedS!: number;
  public movingTimeS!: number;
  public avgSpeedKmh!: number;
  public maxSpeedKmh!: number;
  public avgCadenceRpm!: number;
  public maxCadenceRpm!: number;
  public avgPowerW!: number;
  public maxPowerW!: number;
  public caloriesKcal!: number;
  public riderWeightKg!: number;
  public riderHeightCm!: number;
  public riderAge!: number;
  public riderGender!: string;
  public riderBmi!: number;
  public createdAt!: Date;
}

SensorSession.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    sensorId: { type: DataTypes.STRING(32), field: 'sensor_id' },
    bikeNumber: { type: DataTypes.INTEGER, field: 'bike_number' },
    classId: { type: DataTypes.INTEGER, field: 'class_id' },
    studentId: { type: DataTypes.INTEGER, field: 'student_id' },
    date: { type: DataTypes.DATEONLY, field: 'date' },
    startTime: { type: DataTypes.TIME, field: 'start_time' },
    endTime: { type: DataTypes.TIME, field: 'end_time' },
    distanceKm: { type: DataTypes.DECIMAL(6, 3), field: 'distance_km' },
    elapsedS: { type: DataTypes.INTEGER, field: 'elapsed_s' },
    movingTimeS: { type: DataTypes.INTEGER, field: 'moving_time_s' },
    avgSpeedKmh: { type: DataTypes.DECIMAL(5, 1), field: 'avg_speed_kmh' },
    maxSpeedKmh: { type: DataTypes.DECIMAL(5, 1), field: 'max_speed_kmh' },
    avgCadenceRpm: { type: DataTypes.INTEGER, field: 'avg_cadence_rpm' },
    maxCadenceRpm: { type: DataTypes.INTEGER, field: 'max_cadence_rpm' },
    avgPowerW: { type: DataTypes.INTEGER, field: 'avg_power_w' },
    maxPowerW: { type: DataTypes.INTEGER, field: 'max_power_w' },
    caloriesKcal: { type: DataTypes.INTEGER, field: 'calories_kcal' },
    riderWeightKg: { type: DataTypes.DECIMAL(5, 1), field: 'rider_weight_kg' },
    riderHeightCm: { type: DataTypes.DECIMAL(5, 1), field: 'rider_height_cm' },
    riderAge: { type: DataTypes.INTEGER, field: 'rider_age' },
    riderGender: { type: DataTypes.CHAR(1), field: 'rider_gender' },
    riderBmi: { type: DataTypes.DECIMAL(4, 1), field: 'rider_bmi' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
  },
  {
    sequelize: sensorSequelize,
    tableName: 'sessions',
    timestamps: false,
  }
);

export default SensorSession;
