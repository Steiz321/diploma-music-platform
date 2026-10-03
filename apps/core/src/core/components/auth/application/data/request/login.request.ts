import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginRequest {
  @ApiProperty({ example: "johndoe1@gmail.com" })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({ example: "Pass123" })
  @IsNotEmpty()
  @IsString()
  password: string;
} 