import { Listens } from '../../../../application/data/listens.dto';

export type ListensCreateParams = Pick<Listens, 'song_id' | 'user_id'>;
