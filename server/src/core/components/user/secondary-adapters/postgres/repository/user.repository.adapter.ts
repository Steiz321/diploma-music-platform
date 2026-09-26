import { UserRepository } from 'src/core/components/user/ports/user.repository';
import { InjectModel } from '@nestjs/sequelize';
import UserModel from '../data/user.model';
import { Transaction } from 'sequelize';
import { User } from 'src/core/components/user/application/data/user.dto';
import { GetUserWhere } from '../query-params/user/get-user-where.params';
import { UserCreateParams } from '../query-params/user/create-user.params';
import { UserUpdateParams } from '../query-params/user/update-user.params';

export class UserRepositoryAdapter implements UserRepository {
  constructor(
    @InjectModel(UserModel) private readonly userRepository: typeof UserModel,
  ) {}

  public async getOneWithLikedSongs(userId: number): Promise<User> {
    const model = await this.userRepository.findOne({
      where: { id: userId, deleted_at: null },
      include: [
        {
          association: 'liked_songs',
          where: { deleted_at: null },
          // a where on include makes it an INNER JOIN; keep users with no rows
          required: false,
          through: { attributes: [] },
          include: [
            {
              association: 'user',
              required: true,
              where: { deleted_at: null },
            },
          ],
        },
      ],
    });
    return model?.toJSON() || null;
  }

  public async getOneWithLikedPlaylists(userId: number): Promise<User> {
    const model = await this.userRepository.findOne({
      where: { id: userId, deleted_at: null },
      include: [
        {
          association: 'liked_playlists',
          where: { deleted_at: null },
          // a where on include makes it an INNER JOIN; keep users with no rows
          required: false,
          through: { attributes: [] },
          include: [
            {
              association: 'user',
              required: true,
              where: { deleted_at: null },
            },
          ],
        },
      ],
    });
    return model?.toJSON() || null;
  }

  public async getOneWithOwnSongs(userId: number): Promise<User> {
    const model = await this.userRepository.findOne({
      where: { id: userId, deleted_at: null },
      include: [
        {
          association: 'songs',
          where: { deleted_at: null },
          // a where on include makes it an INNER JOIN; keep users with no rows
          required: false,
          include: [
            {
              association: 'user',
              required: true,
              where: { deleted_at: null },
            },
          ],
        },
      ],
    });
    return model?.toJSON() || null;
  }

  public async getOneWithPlaylists(userId: number): Promise<User> {
    const model = await this.userRepository.findOne({
      where: { id: userId, deleted_at: null },
      include: [
        {
          association: 'playlists',
          where: { deleted_at: null },
          // a where on include makes it an INNER JOIN; keep users with no rows
          required: false,
          include: [
            {
              association: 'user',
              required: true,
              where: { deleted_at: null },
            },
            { association: 'songs', through: { attributes: [] } },
          ],
        },
      ],
    });
    return model?.toJSON() || null;
  }

  public async getOneWhere(where: GetUserWhere): Promise<User> {
    const model = await this.userRepository.findOne({
      where: { ...where, deleted_at: null },
    });
    return model?.toJSON() || null;
  }

  public async create(
    dto: UserCreateParams,
    transaction?: Transaction,
  ): Promise<User> {
    const model = await this.userRepository.create(dto, {
      transaction,
      returning: true,
    });
    return model.toJSON();
  }

  public async update(
    what: UserUpdateParams,
    where: GetUserWhere,
    transaction?: Transaction,
  ): Promise<User> {
    const model = await this.userRepository.update(what, {
      where: { ...where, deleted_at: null },
      transaction,
      returning: true,
    });
    return model[1][0]?.toJSON() || null;
  }

  public async smartDelete(
    userId: number,
    transaction?: Transaction,
  ): Promise<undefined> {
    await this.userRepository.update(
      {
        deleted_at: new Date(),
      },
      {
        where: { id: userId, deleted_at: null },
        transaction,
      },
    );
    return;
  }
}
