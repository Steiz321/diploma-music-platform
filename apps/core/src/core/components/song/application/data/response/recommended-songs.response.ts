import { ApiProperty } from '@nestjs/swagger';

class RecommendedSongUser {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  username: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatar: string;
}

class RecommendationReasonsDto {
  @ApiProperty({
    example: ['mood:melancholic', 'topics:love'],
    description: '"group:value" tags of the track the user likes',
  })
  tags: string[];

  @ApiProperty({ description: 'liked by listeners with a similar taste' })
  similar_listeners: boolean;

  @ApiProperty({ description: 'recommended mostly because it is popular' })
  popular: boolean;
}

export class RecommendedSong {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Wonderwall' })
  name: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg' })
  cover_url: string;

  @ApiProperty({ example: 1 })
  user_id: number;

  @ApiProperty({ example: 'https://example.com/audio.mp3' })
  audio: string;

  @ApiProperty({ example: 12 })
  listens: number;

  @ApiProperty({ example: false })
  is_liked: boolean;

  @ApiProperty({ example: new Date() })
  created_at: Date;

  @ApiProperty({ type: RecommendedSongUser })
  user: RecommendedSongUser;

  @ApiProperty({
    type: RecommendationReasonsDto,
    nullable: true,
    description: 'null for the popular fallback',
  })
  reasons: RecommendationReasonsDto | null;
}

export class RecommendedSongsResponse {
  @ApiProperty({ type: [RecommendedSong] })
  songs: RecommendedSong[];

  @ApiProperty({
    enum: ['recommendations', 'popular'],
    description:
      'popular: the Recommendations service did not answer in time, or has nothing yet',
  })
  source: 'recommendations' | 'popular';

  @ApiProperty({
    description: 'no listening history yet: ranked by popularity',
  })
  cold_start: boolean;
}
