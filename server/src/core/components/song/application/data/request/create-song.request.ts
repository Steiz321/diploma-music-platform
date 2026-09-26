import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSongRequest {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  audio: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  cover: string;

  @ApiProperty({ example: 'Funny, sunny songs' })
  @IsOptional()
  @IsString()
  text: string;
}
