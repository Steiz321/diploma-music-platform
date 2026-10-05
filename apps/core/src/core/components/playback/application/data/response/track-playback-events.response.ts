import { ApiProperty } from '@nestjs/swagger';

export class TrackPlaybackEventsResponse {
  @ApiProperty({ example: 12, description: 'events received in the batch' })
  accepted: number;

  @ApiProperty({
    example: 0,
    description: 'events already stored earlier (retried batch)',
  })
  duplicates: number;
}
