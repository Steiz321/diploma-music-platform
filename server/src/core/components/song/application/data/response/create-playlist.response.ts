import { ApiProperty } from '@nestjs/swagger';

export class CreatePlaylistResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  title: string;

  @ApiProperty({ example: 'Funny, sunny songs' })
  description: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg' })
  cover_url: string;

  @ApiProperty({ example: 0 })
  songs_count: number;

  @ApiProperty({ example: 1 })
  user_id: number;

  @ApiProperty({ example: true })
  is_private: boolean;

  @ApiProperty({ example: new Date() })
  created_at: Date;

  @ApiProperty({ example: new Date() })
  deleted_at?: Date;
}
