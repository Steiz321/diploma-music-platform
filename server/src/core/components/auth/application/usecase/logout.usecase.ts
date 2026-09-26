import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { StatusResponse } from 'src/core/shared-kernel/rest/dto/status-response.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetUserAuthByTokenQuery } from 'src/core/components/user/application/query-handler/get-user-auth-by-token/get-user-auth-by-token.query';
import { UpdateUserAuthCommand } from 'src/core/components/user/application/command-handler/update-user-auth/update-user-auth.command';
import { UserAuth } from 'src/core/components/user/application/data/user-auth.dto';

interface LogoutArguments {
  token: string;
}

@Injectable()
export default class LogoutUseCase
  implements UseCase<LogoutArguments, StatusResponse>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  public async execute(logoutDto: LogoutArguments): Promise<StatusResponse> {
    const userAuth: UserAuth = await this.queryBus.execute(
      new GetUserAuthByTokenQuery(logoutDto.token),
    );

    if (!userAuth) {
      throw new NotFoundException('UserAuth not found');
    }

    await this.commandBus.execute(
      new UpdateUserAuthCommand(userAuth.user_id, {
        token: null,
        refresh_token: null,
      }),
    );

    return StatusResponse.ok();
  }
}
