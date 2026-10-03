import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import {
  DEFAULT_CURSOR,
  DEFAULT_LIMIT,
  DEFAULT_PAGE_NUMBER
} from '../data/constants/pagination.constants';
import {PaginationParameters, PaginationType} from './pagination.type';
import {cursorPaginationMapper} from './cursor/cursor-pagination.mapper';
import {pagePaginationMapper} from './page/page-pagination.mapper';

interface DecoratorParams {
  type?: PaginationType;
}

export const Pagination = createParamDecorator(
  (data: DecoratorParams, context: ExecutionContext): PaginationParameters => {
    const request = context.switchToHttp().getRequest();
    const {cursor, pageNumber, limit} = request.query;

    if (!data?.type && !cursor && !pageNumber && !limit) {
      return null;
    }

    if (cursor && pageNumber) {
      throw new HttpException(
        'Incorrect pagination parameters.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (data.type === 'cursor' || cursor) {
      return cursorPaginationMapper({
        cursor: parseInt(cursor) || DEFAULT_CURSOR,
        limit: parseInt(limit) || DEFAULT_LIMIT
      });
    }

    if (data.type === 'page' || pageNumber) {
      return pagePaginationMapper({
        limit: parseInt(limit) || DEFAULT_LIMIT,
        pageNumber: parseInt(pageNumber) || DEFAULT_PAGE_NUMBER
      });
    }

    return cursorPaginationMapper({
      cursor: parseInt(cursor) || DEFAULT_CURSOR,
      limit: parseInt(limit) || DEFAULT_LIMIT
    });
  }
);
