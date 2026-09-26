import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommentRepositoryType } from './ports/comment.repository';
import { CommentRepositoryAdapter } from './secondary-adapters/postgres/repository/comment.repository.adapter';
import CommentModel from './secondary-adapters/postgres/data/comment.model';

@Module({
  imports: [SequelizeModule.forFeature([CommentModel])],
  providers: [
    {
      provide: CommentRepositoryType,
      useClass: CommentRepositoryAdapter,
    },
  ],
  exports: [],
})
export class CommentModule {}
