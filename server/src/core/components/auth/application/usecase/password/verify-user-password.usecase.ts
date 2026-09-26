import {Inject, Injectable} from '@nestjs/common';
import {UseCase} from 'src/core/shared-kernel/interfaces/use-case';
import {
  CryptoServiceInterface,
  CryptoServiceInterfaceType
} from 'src/core/shared-kernel/ports/crypto-service.interface';

interface VerifyPasswordArgument {
  password: string;
  userPassword: string;
}

@Injectable()
export default class VerifyUserPasswordUseCase
  implements UseCase<VerifyPasswordArgument, boolean>
{
  constructor(
    @Inject(CryptoServiceInterfaceType)
    private readonly cryptoService: CryptoServiceInterface
  ) {}

  public async execute({
    password,
    userPassword
  }: VerifyPasswordArgument): Promise<boolean> {
    if (!userPassword) {
      return false;
    }
    const decryptedPassword = this.cryptoService.decrypt(userPassword);

    const isPasswordVerified = await this.cryptoService.verifyPassword({
      password,
      passwordFromDb: decryptedPassword
    });

    return isPasswordVerified;
  }
}
