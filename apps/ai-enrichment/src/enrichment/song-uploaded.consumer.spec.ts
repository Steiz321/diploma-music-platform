import { createEnvelope } from '@platform/contracts';
import { isSongUploaded } from './song-uploaded.consumer';

const uploaded = (producer: string) =>
  createEnvelope(
    'song.uploaded',
    { song_id: 42, author_id: 7, audio_key: 'song/a.mp3', title: 'A' },
    { producer },
  );

describe('SongUploadedConsumer', () => {
  it('accepts uploads announced by Core only', () => {
    expect(isSongUploaded(uploaded('core'))).toBe(true);
    expect(isSongUploaded(uploaded('analytics'))).toBe(false);
  });
});
