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

  @Column
  user_id: number;

  @Unique
  @Column
  email: string;

  @Column
  password: string;

  @AllowNull
  @Column
  token: string;

  @AllowNull
  @Column
  refresh_token: string;

  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @AllowNull
  @Column
  deleted_at: Date;
}
