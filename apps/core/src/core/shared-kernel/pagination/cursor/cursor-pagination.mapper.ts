import {CursorPaginationParameters} from './cursor-pagination.parameters';

interface CursorPaginationParametersBuilder {
  cursor: number;
  limit: number;
}

export const cursorPaginationMapper = (
  obj: CursorPaginationParametersBuilder
): CursorPaginationParameters => {
  const paginationParametes = new CursorPaginationParameters();

  paginationParametes.limit = obj.limit;
  paginationParametes.offset = obj.cursor;

  return paginationParametes;
};
