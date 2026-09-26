import { Comment } from 'src/core/components/comment/application/data/comment.dto';

export type CommentCreateParams = Pick<Comment, 'song_id' | 'user_id' | 'text'>;
