import { Listens } from '../../../../application/data/listens.dto';

export type ListensUpdateParams = Partial<
  Pick<Listens, 'song_id' | 'user_id' | 'deleted_at'>
>;
