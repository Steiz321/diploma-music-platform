import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

@Table({ tableName: 'user_auth' })
export default class UserAuthModel extends Model<UserAuthModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  user_id: number;

  @Unique
  @AllowNull(false)
  @Column
  email: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  password: string;

  @AllowNull
  @Column(DataType.TEXT)
  token: string;

  @AllowNull
  @Column(DataType.TEXT)
  refresh_token: string;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;
}
