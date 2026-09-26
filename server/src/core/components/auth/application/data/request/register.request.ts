import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class RegisterRequest {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'johndoe1@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({ example: 'Pass123' })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 0,
    minUppercase: 0,
    minNumbers: 0,
    minSymbols: 0,
  })
  password: string;

  @ApiProperty({ example: 'Funny, sunny songs' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  avatar: string;
}
