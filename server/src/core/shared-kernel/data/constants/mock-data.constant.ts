import { buildPublicFileUrl } from '../../common/public-file-url.util';

// Default images, uploaded to the bucket by minio-init (infra/minio/seed)
export const MOCK_FILE_KEYS = {
  avatar: 'mock_avatar.png',
  cover: 'mock-cover.jpg',
} as const;

export const mockData = {
  // getters: the base URL comes from the environment at call time
  get avatar(): string {
    return buildPublicFileUrl(MOCK_FILE_KEYS.avatar);
  },
  get cover(): string {
    return buildPublicFileUrl(MOCK_FILE_KEYS.cover);
  },
  songText:
    "I walk a lonely road, the only one that I have ever known. Don't know where it goes, but it's home to me and I walk along. I walk this empty street On the boulevard of broken dreams where the city sleeps and I'm the only one and I walk alone I walk alone, I walk alone I walk alone, I walk up my shadows all the one that walks beside me my shadow heart say only thing that's been Sometimes I wish someone up there will find me Till then I walk alone I'm walking down the line that divides me somewhere in my mind on the borderline Open up the engine where I walk along Between the lines what's buffed up and everything's alright Check my vital signs and know I'm still alive and I walk along I walk alone, I walk along I walk alone, I walk along I walk this empty street on the boulevard of broken dreams where the city sleeps and I'm the only one that I walk up my shadows only one that walks beside me my shadow, oh, I said only fair at speed and sometimes I wish someone would care well, I'd find me, do it in time",
};
