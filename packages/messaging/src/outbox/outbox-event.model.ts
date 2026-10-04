import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { EventEnvelope } from '@platform/contracts';

@Table({ tableName: 'outbox_events' })
export default class OutboxEventModel extends Model<OutboxEventModel> {
  @PrimaryKey
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  event_type: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  aggregate_type: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  aggregate_id: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  payload: EventEnvelope;

  @AllowNull(false)
  @Column(DataType.DATE)
  occurred_at: Date;

  @AllowNull
  @Column(DataType.DATE)
  published_at: Date | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  attempts: number;

  @AllowNull
  @Column(DataType.TEXT)
  last_error: string | null;
}
