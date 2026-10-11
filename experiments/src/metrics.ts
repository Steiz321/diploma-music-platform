/** Top-k offline metrics of one ranked list against the relevant items. */
export interface ListMetrics {
  hit: number;
  precision: number;
  recall: number;
}

export const listMetrics = (
  ranked: number[],
  relevant: Set<number>,
  k: number,
): ListMetrics => {
  const top = ranked.slice(0, k);
  const hits = top.filter((id) => relevant.has(id)).length;
  return {
    hit: hits > 0 ? 1 : 0,
    // a list shorter than k still counts k slots
    precision: hits / k,
    recall: relevant.size ? hits / relevant.size : 0,
  };
};

/** Mean of every metric over users. */
export const average = (rows: ListMetrics[]): ListMetrics => {
  const n = rows.length || 1;
  return {
    hit: rows.reduce((sum, row) => sum + row.hit, 0) / n,
    precision: rows.reduce((sum, row) => sum + row.precision, 0) / n,
    recall: rows.reduce((sum, row) => sum + row.recall, 0) / n,
  };
};
