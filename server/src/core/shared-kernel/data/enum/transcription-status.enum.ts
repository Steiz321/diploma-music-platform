export enum TranscriptionStatus {
  pending = 'pending',
  done = 'done',
  failed = 'failed',
  // transcription succeeded but no lyrics were recognised (instrumental)
  no_lyrics = 'no_lyrics',
}
