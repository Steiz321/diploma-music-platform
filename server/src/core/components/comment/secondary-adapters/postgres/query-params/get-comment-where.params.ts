import { Comment } from 'src/core/components/comment/application/data/comment.dto';

export type GetCommentWhere = Partial<
  Pick<Comment, 'id' | 'song_id' | 'user_id' | 'text' | 'deleted_at'>
>;
