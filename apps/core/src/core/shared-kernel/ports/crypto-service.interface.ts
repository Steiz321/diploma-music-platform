export interface CryptoServiceInterface {
  encrypt(plainString: string): string;

  decrypt(encryptedString: string): string;

  hash(plainString: string): Promise<string>;

  verifyPassword(obj: {
    password: string;
    passwordFromDb: string;
  }): Promise<boolean>;
}

export const CryptoServiceInterfaceType = Symbol.for('CryptoServiceInterface');
