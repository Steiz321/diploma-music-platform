import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import {ApiResponse} from '../dto/api-response.dto';

@Catch()
export class FinalExceptionFilter implements ExceptionFilter {
  private readonly isProd = process.env.NODE_ENV === 'prod';

  private static parseError(exception: Error): HttpException {
    return exception instanceof HttpException
      ? exception
      : new InternalServerErrorException(exception.message);
  }

  //   @WithSentry()
  public catch(originException: Error, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const httpException = FinalExceptionFilter.parseError(originException);

    if (httpException.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Logger.error(originException.stack);
      const userData = request.user ? {id: request.user.id} : null;
    }

    if (
      !this.isProd ||
      (this.isProd &&
        httpException.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR)
    ) {
      response
        .status(httpException.getStatus())
        .json(ApiResponse.error(httpException));
    } else {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(ApiResponse.error('Something went wrong'));
    }
  }
}
