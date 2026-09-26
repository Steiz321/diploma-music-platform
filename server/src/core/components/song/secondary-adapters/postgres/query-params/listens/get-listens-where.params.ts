import { Listens } from '../../../../application/data/listens.dto';

export type GetListensWhere = Partial<
  Pick<Listens, 'id' | 'song_id' | 'user_id' | 'deleted_at'>
>;
