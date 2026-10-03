import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePlaylistRequest {
  @ApiProperty({ example: 'best songs' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'description of the playlist' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  cover: string;

  @ApiProperty({ example: true })
  @Transform(({ value }) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  is_private: boolean;
}
