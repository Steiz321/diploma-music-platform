import {applyDecorators, Type} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiQuery,
  getSchemaPath
} from '@nestjs/swagger';
import {PaginationType} from './pagination.type';
import {
  DEFAULT_CURSOR,
  DEFAULT_LIMIT,
  DEFAULT_PAGE_NUMBER
} from '../data/constants/pagination.constants';
import {Paginated} from './paginated.output';

export const PaginatedResponse = (
  type: Type,
  paginationType?: PaginationType
) => {
  const apiQueryParams = [];

  if (paginationType) {
    apiQueryParams.push(
      ApiQuery({
        name: 'limit',
        schema: {default: DEFAULT_LIMIT, type: 'number', minimum: 1},
        required: false
      })
    );
    if (paginationType === 'cursor') {
      apiQueryParams.push(
        ApiQuery({
          name: 'cursor',
          schema: {default: DEFAULT_CURSOR, type: 'number', minimum: 0},
          required: false
        })
      );
    }

    if (paginationType === 'page') {
      apiQueryParams.push(
        ApiQuery({
          name: 'pageNumber',
          schema: {default: DEFAULT_PAGE_NUMBER, type: 'number', minimum: 1},
          required: false
        })
      );
    }
  }

  return applyDecorators(
    ApiExtraModels(type, Paginated),
    ...apiQueryParams,
    ApiOkResponse({
      schema: {
        allOf: [
          {$ref: getSchemaPath(Paginated)},
          {
            properties: {
              data: {
                type: 'array',
                items: {$ref: getSchemaPath(type)}
              }
            }
          }
        ]
      }
    })
  );
};
