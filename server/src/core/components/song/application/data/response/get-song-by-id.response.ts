import { ApiProperty } from '@nestjs/swagger';
import { TranscriptionStatus } from 'src/core/shared-kernel/data/enum/transcription-status.enum';

class User {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  username: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatar: string;
}

export class GetSongByIdResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ example: 'Funny, sunny songs' })
  description: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg' })
  cover_url: string;

  @ApiProperty({ example: 1 })
  user_id: number;

  @ApiProperty({ example: 'Funny, sunny songs' })
  text: string;

  @ApiProperty({ example: true })
  is_liked: boolean;

  @ApiProperty({ example: 'https://example.com/audio.mp3' })
  audio: string;

  @ApiProperty({ example: 1 })
  listens: number;

  @ApiProperty({
    enum: TranscriptionStatus,
    example: TranscriptionStatus.done,
  })
  transcription_status: TranscriptionStatus;

  @ApiProperty({ example: 'en', nullable: true })
  language: string | null;

  @ApiProperty({ example: new Date() })
  created_at: Date;

  @ApiProperty({ example: new Date() })
  deleted_at?: Date;

  @ApiProperty({ type: User })
  user: User;
}
