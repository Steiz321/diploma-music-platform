import { ApiProperty } from '@nestjs/swagger';

export class CreateSongResponse {
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

  @ApiProperty({ example: 'https://example.com/audio.mp3' })
  audio: string;

  @ApiProperty({ example: 1 })
  listens: number;

  @ApiProperty({ example: new Date() })
  created_at: Date;

  @ApiProperty({ example: new Date() })
  deleted_at?: Date;
}
