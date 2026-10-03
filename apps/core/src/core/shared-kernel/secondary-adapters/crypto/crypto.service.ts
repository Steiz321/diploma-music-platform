/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as crypto from 'crypto';
import {ConfigService} from '@nestjs/config';
import * as argon2 from 'argon2';
import * as nacl from 'tweetnacl';
import {Injectable} from '@nestjs/common';
import {CryptoServiceInterface} from 'src/core/shared-kernel/ports/crypto-service.interface';

@Injectable()
export class CryptoService implements CryptoServiceInterface {
  private readonly encryptionKey: string;
  private readonly STUB_PASSWORD: Promise<string>;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get('node.encryptionKey');
    this.STUB_PASSWORD = argon2.hash(crypto.randomBytes(16));
  }

  private convertStringToArray(string: string, encoding?: BufferEncoding) {
    return Uint8Array.from(Buffer.from(string, encoding));
  }

  private convertArrayToString(
    array: any,
    arrayEncoding?: BufferEncoding,
    stringEncoding?: BufferEncoding
  ) {
    return Buffer.from(array, arrayEncoding).toString(stringEncoding);
  }

  public encrypt(plainString: string): string {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

    // encrypt string and concat it with nonce -> string:nonce
    const encryptedString = `${this.convertArrayToString(
      nacl.secretbox(
        this.convertStringToArray(plainString),
        nonce,
        // @ts-ignore
        // it will convert string to array of char codes
        Uint8Array.from(this.encryptionKey)
      ),
      'hex',
      'hex'
    )}:${this.convertArrayToString(nonce, 'hex', 'hex')}`;

    return encryptedString;
  }

  public decrypt(encryptedString: string): string {
    const [encryptedValue, nonce] = encryptedString.split(':');

    const decryptedString = this.convertArrayToString(
      nacl.secretbox.open(
        this.convertStringToArray(encryptedValue, 'hex'),
        this.convertStringToArray(nonce, 'hex'),
        // @ts-ignore
        // it will convert string to array of char codes
        Uint8Array.from(this.encryptionKey)
      ),
      'hex'
    );

    return decryptedString;
  }

  public async hash(plainString: string): Promise<string> {
    const sha512 = nacl.hash(
      Uint8Array.from(Buffer.from(plainString))
    ) as Buffer;
    return argon2.hash(sha512);
  }

  public async verifyPassword(obj: {
    password: string;
    passwordFromDb: string;
  }): Promise<boolean> {
    const passwordSha512 = nacl.hash(
      Uint8Array.from(Buffer.from(obj.password))
    ) as Buffer;
    // Prevent time based attack
    return argon2.verify(
      obj.passwordFromDb ?? (await this.STUB_PASSWORD),
      passwordSha512
    );
  }
}
