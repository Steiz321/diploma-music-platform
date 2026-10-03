import {CursorPaginationParameters} from './cursor/cursor-pagination.parameters';
import {PagePaginationParameters} from './page/page-pagination.parameters';

export type PaginationType = 'cursor' | 'page';

export type PaginationParameters =
  | CursorPaginationParameters
  | PagePaginationParameters;
