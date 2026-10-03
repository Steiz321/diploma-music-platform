import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserAuth as UserAuthDto } from 'src/core/components/user/application/data/user-auth.dto';

export const UserAuth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.userAuth;
  },
);

export class UserAuthRequestObject extends UserAuthDto {}
