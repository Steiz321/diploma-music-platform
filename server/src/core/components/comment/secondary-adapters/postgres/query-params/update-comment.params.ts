import { Comment } from 'src/core/components/comment/application/data/comment.dto';

export type CommentUpdateParams = Partial<
  Pick<Comment, 'song_id' | 'user_id' | 'text' | 'deleted_at'>
>;
