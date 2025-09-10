import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NotificationTokenAttrs {
  id: number;
  personId: number;
  token: string;
  platform: string;
  deviceName?: string | null;
  enabled: boolean;
  lastSeenAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<NotificationTokenAttrs, 'id' | 'enabled'>;

class NotificationToken extends Model<NotificationTokenAttrs, Creation>
  implements NotificationTokenAttrs {
  declare id: number;
  declare personId: number;
  declare token: string;
  declare platform: string;
  declare deviceName?: string | null;
  declare enabled: boolean;
  declare lastSeenAt?: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

NotificationToken.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    personId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    platform: { type: DataTypes.STRING(255), allowNull: false },
    deviceName: { type: DataTypes.STRING(255), allowNull: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'notification_tokens',
    indexes: [{ fields: ['personId'] }, { unique: true, fields: ['token'] }],
  }
);

export default NotificationToken;
