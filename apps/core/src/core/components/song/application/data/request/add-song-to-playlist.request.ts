import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddSongToPlaylistRequest {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  songId: number;
}
