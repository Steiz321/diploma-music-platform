import {ApiResponseProperty} from '@nestjs/swagger';
import {PaginationParameters} from './pagination.type';
import {CursorPaginationParameters} from './cursor/cursor-pagination.parameters';
import {PagePaginationParameters} from './page/page-pagination.parameters';

class PaginatedResponseMetadata {
  @ApiResponseProperty({})
  limit: number;
  @ApiResponseProperty({})
  page?: number | null;
  @ApiResponseProperty({})
  cursor?: number | null;
  @ApiResponseProperty({})
  has_more?: boolean;
  @ApiResponseProperty({})
  total?: number;
}

export class Paginated<T> {
  data: T[];

  @ApiResponseProperty({type: PaginatedResponseMetadata})
  pagination: PaginatedResponseMetadata | null;
}

export const paginatedResponseMapper = <T>(
  data: T[],
  pagination: PaginationParameters,
  total: number
): Paginated<T> => {
  const model = new Paginated<T>();
  model.data = data;

  if (!pagination) {
    model.pagination = null;
  } else {
    if (pagination instanceof CursorPaginationParameters) {
      const cursor = data ? pagination.offset + data.length : pagination.offset;
      model.pagination = {
        limit: pagination.limit,
        cursor,
        has_more: cursor < total,
        total
      };
    } else if (pagination instanceof PagePaginationParameters) {
      const page = pagination.offset / pagination.limit + 1;
      model.pagination = {
        limit: pagination.limit,
        page,
        has_more: page * pagination.limit < total,
        total
      };
    }
  }

  return model;
};
