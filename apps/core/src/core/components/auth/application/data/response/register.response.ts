import { ApiProperty } from '@nestjs/swagger';
import { UserType } from 'src/core/shared-kernel/data/enum/user-type.enum';

export class RegisterResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'JohnDoe123' })
  username: string;

  @ApiProperty({ example: 'Funny, sunny songs' })
  description: string;

  @ApiProperty({
    example:
      'https://www.pngitem.com/pimgs/m/146-1468479_transparent-avatar-png-male-avatar-icon-transparent-png-removebg-preview.png',
  })
  avatar: string;

  @ApiProperty({ example: UserType.user })
  type: UserType;

  @ApiProperty({ example: false })
  is_verified: boolean;

  @ApiProperty({ example: 'johndoe1@gmail.com' })
  email: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoidmxhZGZvQGdtYWlsLmNvbSIsImlhdCI6MTcwNTA5NSwiZXhwIjoxNzA1MTA4ODk1fQ.4zhEqnN6jPPVThqcguIWPJwF1JxXs_J_ZVexU64qfDw',
  })
  token: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoidmxhZGZvQGdtYWlsLmNvbSIsImlhdCI6MTcwNTA5NSwiZXhwIjoxNzA1MTA4ODk1fQ.4zhEqnN6jPPVThqcguIWPJwF1JxXs_J_ZVexU64qfDw',
  })
  refresh_token: string;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  deleted_at: Date;
}
