import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class ScheduledMessage extends Model {
  public id!: number;
  public userId!: string;
  public channelId!: string;
  public message!: string;
  public scheduledTime!: Date;
  public status!: 'pending' | 'processing' | 'sent' | 'cancelled' | 'failed';
  public sentAt?: Date;
  public errorMessage?: string;
  public retryCount!: number;
  public slackMessageId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ScheduledMessage.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'user_id'
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'channel_id'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_time'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'retry_count'
  },
  slackMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'slack_message_id'
  }
}, {
  sequelize,
  tableName: 'scheduled_messages',
  underscored: true,
});
