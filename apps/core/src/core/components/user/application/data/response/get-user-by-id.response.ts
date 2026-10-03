import { ApiProperty } from '@nestjs/swagger';
import { UserType } from 'src/core/shared-kernel/data/enum/user-type.enum';

class User {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  username: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatar: string;
}

class Song {
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

  @ApiProperty({ example: true })
  is_liked: boolean;

  @ApiProperty({ example: 1 })
  listens: number;

  @ApiProperty({ example: new Date() })
  created_at: Date;

  @ApiProperty({ example: new Date() })
  deleted_at?: Date;

  @ApiProperty({ type: User })
  user: User;
}

export class GetUserByIdResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  username: string;

  @ApiProperty({ example: 'Funny, sunny songs' })
  description: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatar: string;

  @ApiProperty({ example: UserType.user })
  type: UserType;

  @ApiProperty({ example: false })
  is_verified: boolean;

  @ApiProperty({ example: new Date() })
  created_at: Date;

  @ApiProperty({ example: new Date() })
  deleted_at?: Date;

  @ApiProperty({ type: [Song] })
  songs: Song[];
}
