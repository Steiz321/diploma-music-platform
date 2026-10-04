import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

/** Inbox: ids of consumed events, to ignore repeated deliveries. */
@Table({ tableName: 'processed_events' })
export default class ProcessedEventModel extends Model<ProcessedEventModel> {
  @PrimaryKey
  @Column(DataType.UUID)
  event_id: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  processed_at: Date;
}
