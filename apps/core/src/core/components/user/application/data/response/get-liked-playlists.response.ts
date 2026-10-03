import { ApiProperty } from '@nestjs/swagger';

class User {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  username: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatar: string;
}

class GetLikedPlaylists {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  title: string;

  @ApiProperty({ example: 'Funny, sunny songs' })
  description: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg' })
  cover_url: string;

  @ApiProperty({ example: 1 })
  user_id: number;

  @ApiProperty({ example: true })
  is_liked: boolean;

  @ApiProperty({ example: new Date() })
  created_at: Date;

  @ApiProperty({ example: new Date() })
  deleted_at?: Date;

  @ApiProperty({ type: User })
  user: User;
}

export class GetLikedPlaylistsResponse {
  @ApiProperty({ type: [GetLikedPlaylists] })
  liked_playlists: GetLikedPlaylists[];
}
