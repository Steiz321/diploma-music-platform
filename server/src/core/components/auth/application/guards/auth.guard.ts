import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  TokenServiceInterface,
  TokenServiceInterfaceType,
} from 'src/core/shared-kernel/ports/token-service.interface';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserAuthByTokenQuery } from 'src/core/components/user/application/query-handler/get-user-auth-by-token/get-user-auth-by-token.query';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TokenServiceInterfaceType)
    private readonly tokenService: TokenServiceInterface,
    private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // every failure is the same 401 without details: missing header,
    // wrong scheme, bad signature, expired token, revoked session
    const [scheme, token] = String(req.headers.authorization ?? '').split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    if (!this.tokenService.verifyToken(token)) {
      throw new UnauthorizedException();
    }

    const userAuth = await this.queryBus.execute(
      new GetUserAuthByTokenQuery(token),
    );

    if (!userAuth) {
      throw new UnauthorizedException();
    }

    req.userAuth = {
      ...userAuth,
    };

    return true;
  }
}
