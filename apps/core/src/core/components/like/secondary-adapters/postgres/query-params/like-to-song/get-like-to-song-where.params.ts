import { LikeToSong } from 'src/core/components/like/application/data/like-to-song.dto';

export type GetLikeToSongWhere = Partial<
  Pick<LikeToSong, 'id' | 'song_id' | 'user_id' | 'deleted_at'>
>;
