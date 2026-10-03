import {Model} from 'sequelize-typescript';
import {ResultWithTotal} from '../types/result-with-total.type';

interface ResultWithTotalBuilder<T> {
  rows: Model<T>[];
  count: number;
}

export const resultWithTotalMapper = <T>(
  obj: ResultWithTotalBuilder<T>
): ResultWithTotal<T> => ({
  data: obj.rows.map(row => row.toJSON()),
  total: obj.count
});
