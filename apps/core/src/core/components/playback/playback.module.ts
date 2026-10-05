import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlaybackEventsController } from './primary-adapters/playback-events.controller';
import TrackPlaybackEventsUseCase from './application/usecase/track-playback-events.usecase';

/** Player events from the client (POST /events) → outbox → RabbitMQ. */
@Module({
  // AuthGuard: QueryBus + the global TokenModule
  imports: [CqrsModule],
  providers: [TrackPlaybackEventsUseCase],
  controllers: [PlaybackEventsController],
})
export class PlaybackModule {}
