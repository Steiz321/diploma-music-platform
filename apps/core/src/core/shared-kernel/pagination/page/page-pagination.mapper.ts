import {PagePaginationParameters} from './page-pagination.parameters';

interface PagePaginationParametersBuilder {
  limit: number;
  pageNumber: number;
}

export const pagePaginationMapper = (
  obj: PagePaginationParametersBuilder
): PagePaginationParameters => {
  const paginationParametes = new PagePaginationParameters();

  paginationParametes.limit = obj.limit;
  paginationParametes.offset = obj.limit * (obj.pageNumber - 1);

  return paginationParametes;
};
