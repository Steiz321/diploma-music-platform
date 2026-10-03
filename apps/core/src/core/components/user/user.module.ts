import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserRepositoryType } from './ports/user.repository';
import UserModel from './secondary-adapters/postgres/data/user.model';
import { UserRepositoryAdapter } from './secondary-adapters/postgres/repository/user.repository.adapter';
import { UserAuthRepositoryType } from './ports/user-auth.repository';
import { UserAuthRepositoryAdapter } from './secondary-adapters/postgres/repository/user-auth.repository.adapter';
import UserAuthModel from './secondary-adapters/postgres/data/user-auth.model';
import { GetUserAuthByEmailQueryHandler } from './application/query-handler/get-user-auth-by-email/get-user-auth-by-email.handler';
import { CreateUserWithCredsCommandHandler } from './application/command-handler/create-user-with-creds/create-user-with-creds.handler';
import { GetUserByUsernameQueryHandler } from './application/query-handler/get-user-by-username/get-user-by-username.handler';
import { UpdateUserAuthCommandHandler } from './application/command-handler/update-user-auth/update-user-auth.handler';
import { GetUserAuthByTokenQueryHandler } from './application/query-handler/get-user-auth-by-token/get-user-auth-by-token.handler';
import { GetUserByIdQueryHandler } from './application/query-handler/get-user-by-id/get-user-by-id.handler';
import GetUserByIdUseCase from './application/usecase/get-user-by-id.usecase';
import GetUsersLikedSongsUseCase from './application/usecase/get-users-liked-songs.usecase';
import { UserController } from './primary-adapters/user.controller';
import GetUsersLikedPlaylistsUseCase from './application/usecase/get-users-liked-playlists.usecase';

const queryHandlers = [
  GetUserAuthByEmailQueryHandler,
  GetUserByUsernameQueryHandler,
  GetUserAuthByTokenQueryHandler,
  GetUserByIdQueryHandler,
];

const commandHandlers = [
  CreateUserWithCredsCommandHandler,
  UpdateUserAuthCommandHandler,
];

const useCases = [
  GetUserByIdUseCase,
  GetUsersLikedSongsUseCase,
  GetUsersLikedPlaylistsUseCase,
];

@Module({
  imports: [SequelizeModule.forFeature([UserModel, UserAuthModel]), CqrsModule],
  providers: [
    {
      provide: UserRepositoryType,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: UserAuthRepositoryType,
      useClass: UserAuthRepositoryAdapter,
    },
    ...queryHandlers,
    ...commandHandlers,
    ...useCases,
  ],
  controllers: [UserController],
})
export class UserModule {}
