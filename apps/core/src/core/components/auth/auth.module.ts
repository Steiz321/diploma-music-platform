import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import GetEncryptedPasswordUseCase from './application/usecase/password/get-encrypted-password.usecase';
import VerifyUserPasswordUseCase from './application/usecase/password/verify-user-password.usecase';
import { AuthController } from './primary-adapters/auth.controller';
import { S3Module } from '../../shared-kernel/secondary-adapters/s3/s3.module';
import LoginUseCase from './application/usecase/login.usecase';
import LogoutUseCase from './application/usecase/logout.usecase';
import { AuthGuard } from './application/guards/auth.guard';
import { TokenModule } from 'src/core/shared-kernel/secondary-adapters/token/token.module';
import RegisterUseCase from './application/usecase/register.usecase';

const useCases = [
  GetEncryptedPasswordUseCase,
  VerifyUserPasswordUseCase,
  LoginUseCase,
  LogoutUseCase,
  RegisterUseCase,
];

@Module({
  imports: [CqrsModule, S3Module, TokenModule],
  providers: [AuthGuard, ...useCases],
  controllers: [AuthController],
  exports: [AuthGuard, GetEncryptedPasswordUseCase, VerifyUserPasswordUseCase],
})
export class AuthModule {}
