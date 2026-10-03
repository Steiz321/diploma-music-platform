import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LikeToSongRepositoryType } from './ports/like-to-song.repository';
import { LikeToPlaylistRepositoryType } from './ports/like-to-playlist.repository';
import { LikeToSongRepositoryAdapter } from './secondary-adapters/postgres/repository/like-to-song.repository.adapter';
import { LikeToPlaylistRepositoryAdapter } from './secondary-adapters/postgres/repository/like-to-playlist.repository.adapter';
import LikeToSongModel from './secondary-adapters/postgres/data/like-to-song.model';
import LikeToPlaylistModel from './secondary-adapters/postgres/data/like-to-playlist.model';
import { SongLikeController } from './primary-adapters/song-like.controller';
import CreateSongLikeUseCase from './application/usecase/create-song-like.usecase';
import { CqrsModule } from '@nestjs/cqrs';
import { CheckSongLikeQueryHandler } from './application/query-handler/check-song-like/check-song-like.handler';
import CreatePlaylistLikeUseCase from './application/usecase/create-playlist-like.usecase';
import { CheckPlaylistLikeQueryHandler } from './application/query-handler/check-playlist-like/check-playlist-like.handler';
import { PlaylistLikeController } from './primary-adapters/playlist-like.controller';
import { DeleteSongLikesCommandHandler } from './application/command-handler/delete-song-likes/delete-song-likes.handler';
import { DeletePlaylistLikesCommandHandler } from './application/command-handler/delete-playlist-likes/delete-playlist-likes.handler';

const UseCases = [CreateSongLikeUseCase, CreatePlaylistLikeUseCase];

const QueryHandlers = [
  CheckSongLikeQueryHandler,
  CheckPlaylistLikeQueryHandler,
];

const CommandHandlers = [
  DeleteSongLikesCommandHandler,
  DeletePlaylistLikesCommandHandler,
];

@Module({
  imports: [
    CqrsModule,
    SequelizeModule.forFeature([LikeToSongModel, LikeToPlaylistModel]),
  ],
  providers: [
    {
      provide: LikeToSongRepositoryType,
      useClass: LikeToSongRepositoryAdapter,
    },
    {
      provide: LikeToPlaylistRepositoryType,
      useClass: LikeToPlaylistRepositoryAdapter,
    },
    ...UseCases,
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  controllers: [SongLikeController, PlaylistLikeController],
  exports: [],
})
export class LikeModule {}
