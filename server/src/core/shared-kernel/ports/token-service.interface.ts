import {GenerateTokenParams} from '../secondary-adapters/token/data/generate-token.params';

export interface TokenServiceInterface {
  generateToken(params: GenerateTokenParams): string;

  verifyToken(token: string): any;

  decodeToken(token: string): any;
}

export const TokenServiceInterfaceType = Symbol.for('TokenServiceInterface');
