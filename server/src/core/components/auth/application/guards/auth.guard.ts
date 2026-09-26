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

    const authorizationHeader = req.headers.authorization as string;

    const token = authorizationHeader.split(' ')[1];
    const isTokenVerified = this.tokenService.verifyToken(token);

    if (!isTokenVerified) {
      throw new UnauthorizedException('Invalid token');
    }

    const userAuth = await this.queryBus.execute(
      new GetUserAuthByTokenQuery(token),
    );

    if (!userAuth) {
      throw new UnauthorizedException('Invalid token');
    }

    req.userAuth = {
      ...userAuth,
    };

    return true;
  }
}
