import {
  Body,
  Controller,
  Post,
  Session,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RegisterRequest } from '../application/data/request/register.request';
import { ApiResponseDoc } from 'src/core/shared-kernel/rest/dto/api-response.dto';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { LoginRequest } from '../application/data/request/login.request';
import { LoginResponse } from '../application/data/response/login.response';
import LoginUseCase from '../application/usecase/login.usecase';
import LogoutUseCase from '../application/usecase/logout.usecase';
import { AuthGuard } from '../application/guards/auth.guard';
import RegisterUseCase from '../application/usecase/register.usecase';
import { RegisterResponse } from '../application/data/response/register.response';
import {
  UserAuth,
  UserAuthRequestObject,
} from '../application/decorators/user-auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransformFilePipe } from 'src/core/shared-kernel/pipe/transform-file.pipe';

@Controller()
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Post('/register')
  @ApiResponseDoc(RegisterResponse)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data', 'application/json')
  async registerUser(
    @Body() registerDto: RegisterRequest,
    @UploadedFile(new TransformFilePipe({ isRequired: false }))
    avatar: Express.Multer.File,
  ) {
    return this.registerUseCase.execute({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      description: registerDto.description,
      avatar,
    });
  }

  @Post('/login')
  @ApiResponseDoc(LoginResponse)
  async login(@Body() loginDto: LoginRequest) {
    return this.loginUseCase.execute(loginDto);
  }

  @Post('/logout')
  @ApiResponseDoc(StatusResponse)
  @UseGuards(AuthGuard)
  async logout(@UserAuth() userAuth: UserAuthRequestObject) {
    return this.logoutUseCase.execute({ token: userAuth.token });
  }
}
