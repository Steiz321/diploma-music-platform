import { LikeToSong } from 'src/core/components/like/application/data/like-to-song.dto';

export type LikeToSongUpdateParams = Partial<
  Pick<LikeToSong, 'song_id' | 'user_id' | 'deleted_at'>
>;
