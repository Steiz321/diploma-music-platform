import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenServiceInterface } from 'src/core/shared-kernel/ports/token-service.interface';
import { GenerateTokenParams } from './data/generate-token.params';
import { TokenType } from './data/token-type.enum';
import { ACCESS_TOKEN_EXPIRING_HOURS } from './data/constants/access-token-expiring-hours';
import { REFRESH_TOKEN_EXPIRING_HOURS } from './data/constants/refresh-token-expiring-hours';

@Injectable()
export class TokenService implements TokenServiceInterface {
  constructor(private readonly jwtService: JwtService) {}

  generateToken({ payload, type }: GenerateTokenParams): string {
    let tokenExpiringHours: number | null;
    if (type === TokenType.accessToken) {
      tokenExpiringHours = ACCESS_TOKEN_EXPIRING_HOURS;
    }
    if (type === TokenType.refreshToken) {
      tokenExpiringHours = REFRESH_TOKEN_EXPIRING_HOURS;
    }

    return this.jwtService.sign(payload, {
      expiresIn: `${tokenExpiringHours}h`,
    });
  }

  verifyToken(token: string) {
    try {
      this.jwtService.verify(token);
      return true;
    } catch (err) {
      return false;
    }
  }

  decodeToken(token: string) {
    try {
      return this.jwtService.decode(token);
    } catch (err) {
      return null;
    }
  }
}
