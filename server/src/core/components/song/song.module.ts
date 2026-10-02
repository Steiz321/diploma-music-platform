import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import SongModel from './secondary-adapters/postgres/data/song.model';
import ListensModel from './secondary-adapters/postgres/data/listens.model';
import PlaylistModel from './secondary-adapters/postgres/data/playlist.model';
import SongToPlaylistModel from './secondary-adapters/postgres/data/song-to-playlist.model';
import { ListensRepositoryAdapter } from './secondary-adapters/postgres/repository/listens.repository.adapter';
import { PlaylistRepositoryAdapter } from './secondary-adapters/postgres/repository/playlist.repository.adapter';
import { SongToPlaylistRepositoryAdapter } from './secondary-adapters/postgres/repository/song-to-playlist.repository.adapter';
import { SongRepositoryAdapter } from './secondary-adapters/postgres/repository/song.repository.adapter';
import { SongRepositoryType } from './ports/song.repository';
import { PlaylistRepositoryType } from './ports/playlist.repository';
import { ListensRepositoryType } from './ports/listens.repository';
import { SongToPlaylistRepositoryType } from './ports/song-to-playlist.repository';
import { GetUserSongsHandler } from './application/query-handler/get-user-songs/get-user-songs.handler';
import { SongController } from './primary-adapters/song.controller';
import CreateSongUseCase from './application/usecase/create-song.usecase';
import GetAllSongsUseCase from './application/usecase/get-all-songs.usecase';
import GetSongByIdUseCase from './application/usecase/get-song-by-id.usecase';
import { S3Module } from 'src/core/shared-kernel/secondary-adapters/s3/s3.module';
import { TranscriptionModule } from 'src/core/shared-kernel/secondary-adapters/transcription/transcription.module';
import { GetSongByIdHandler } from './application/query-handler/get-song-by-id/get-song-by-id.handler';
import { PlaylistController } from './primary-adapters/playlist.controller';
import CreatePlaylistUseCase from './application/usecase/create-playlist.usecase';
import GetPlaylistByIdUseCase from './application/usecase/get-playlist-by-id.usecase';
import AddSongToPlaylistUseCase from './application/usecase/add-song-to-playlist.usecase';
import GetAllPlaylistsUseCase from './application/usecase/get-all-playlists.usecase';
import GetPlaylistsByUserIdUseCase from './application/usecase/get-playlists-by-user.usecase';
import { GetPlaylistByIdQueryHandler } from './application/query-handler/get-playlist-by-id/get-playlist-by-id.handler';
import CreateListenForSongUseCase from './application/usecase/create-listen-for-song.usecase';
import DeleteSongUseCase from './application/usecase/delete-song.usecase';
import DeletePlaylistUseCase from './application/usecase/delete-playlist.usecase';

const CommandHandlers = [];
const QueryHandlers = [
  GetUserSongsHandler,
  GetSongByIdHandler,
  GetPlaylistByIdQueryHandler,
];
const UseCases = [
  CreateSongUseCase,
  GetAllSongsUseCase,
  GetSongByIdUseCase,
  CreatePlaylistUseCase,
  GetPlaylistByIdUseCase,
  AddSongToPlaylistUseCase,
  GetAllPlaylistsUseCase,
  GetPlaylistsByUserIdUseCase,
  CreateListenForSongUseCase,
  DeleteSongUseCase,
  DeletePlaylistUseCase,
];

@Module({
  imports: [
    CqrsModule,
    SequelizeModule.forFeature([
      SongModel,
      PlaylistModel,
      ListensModel,
      SongToPlaylistModel,
    ]),
    S3Module,
    TranscriptionModule,
    // POST /song/:id/listen: one counted listen per user–song pair per 30 s
    ThrottlerModule.forRoot([{ name: 'listen', ttl: 30_000, limit: 1 }]),
  ],
  providers: [
    {
      provide: SongRepositoryType,
      useClass: SongRepositoryAdapter,
    },
    {
      provide: PlaylistRepositoryType,
      useClass: PlaylistRepositoryAdapter,
    },
    {
      provide: ListensRepositoryType,
      useClass: ListensRepositoryAdapter,
    },
    {
      provide: SongToPlaylistRepositoryType,
      useClass: SongToPlaylistRepositoryAdapter,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...UseCases,
  ],
  controllers: [SongController, PlaylistController],
})
export class SongModule {}
