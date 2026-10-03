import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePlaylistLikeRequest {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  playlistId: number;
}
