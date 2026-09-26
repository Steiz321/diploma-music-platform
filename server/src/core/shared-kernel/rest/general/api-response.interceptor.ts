import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {map, Observable} from 'rxjs';
import {ApiResponse} from '../dto/api-response.dto';

@Injectable()
export default class ApiResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> | Promise<Observable<ApiResponse<T>>> {
    return next.handle().pipe(map(data => ApiResponse.ok(data)));
  }
}
