import {Inject, Injectable} from '@nestjs/common';
import {UseCase} from 'src/core/shared-kernel/interfaces/use-case';
import {
  CryptoServiceInterface,
  CryptoServiceInterfaceType
} from 'src/core/shared-kernel/ports/crypto-service.interface';

@Injectable()
export default class GetEncryptedPasswordUseCase
  implements UseCase<string, string>
{
  constructor(
    @Inject(CryptoServiceInterfaceType)
    private readonly cryptoService: CryptoServiceInterface
  ) {}

  public async execute(password: string): Promise<string> {
    const hashedPassword = await this.cryptoService.hash(password);
    const encryptedPassword = this.cryptoService.encrypt(hashedPassword);

    return encryptedPassword;
  }
}
