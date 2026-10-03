import { Transaction } from 'sequelize';
import { CommentCreateParams } from '../secondary-adapters/postgres/query-params/create-comment.params';
import { GetCommentWhere } from '../secondary-adapters/postgres/query-params/get-comment-where.params';
import { Comment } from '../application/data/comment.dto';
import { CommentUpdateParams } from '../secondary-adapters/postgres/query-params/update-comment.params';

export interface CommentRepository {
  getOneWhere(where: GetCommentWhere): Promise<Comment>;

  create(dto: CommentCreateParams, transaction?: Transaction): Promise<Comment>;

  update(
    what: CommentUpdateParams,
    where: GetCommentWhere,
    transaction?: Transaction,
  ): Promise<Comment>;

  smartDelete(commentId: number, transaction?: Transaction): Promise<undefined>;
}

export const CommentRepositoryType = Symbol.for('CommentRepository');
