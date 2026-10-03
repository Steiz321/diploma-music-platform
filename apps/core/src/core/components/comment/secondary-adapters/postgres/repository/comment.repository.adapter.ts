import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentRepository } from '../../../ports/comment.repository';
import { Comment } from '../../../application/data/comment.dto';
import CommentModel from '../data/comment.model';
import { GetCommentWhere } from '../query-params/get-comment-where.params';
import { CommentCreateParams } from '../query-params/create-comment.params';
import { Transaction } from 'sequelize';
import { CommentUpdateParams } from '../query-params/update-comment.params';

@Injectable()
export class CommentRepositoryAdapter implements CommentRepository {
  constructor(
    @InjectModel(CommentModel)
    private readonly commentModel: typeof CommentModel,
  ) {}

  async getOneWhere(where: GetCommentWhere): Promise<Comment> {
    const comment = await this.commentModel.findOne({ where });
    return comment?.toJSON() || null;
  }

  async create(
    dto: CommentCreateParams,
    transaction?: Transaction,
  ): Promise<Comment> {
    const comment = await this.commentModel.create(dto, { transaction });
    return comment?.toJSON() || null;
  }

  async update(
    what: CommentUpdateParams,
    where: GetCommentWhere,
    transaction?: Transaction,
  ): Promise<Comment> {
    const comment = await this.commentModel.update(what, {
      where,
      transaction,
      returning: true,
    });
    return comment[1][0]?.toJSON() || null;
  }

  async smartDelete(
    commentId: number,
    transaction?: Transaction,
  ): Promise<undefined> {
    await this.commentModel.update(
      { deleted_at: new Date() },
      { where: { id: commentId }, transaction },
    );
  }
}
