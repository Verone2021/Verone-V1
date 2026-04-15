import type { StockData, StockSummary } from './stock-types';

export function calculateStockSummary(data: StockData[]): StockSummary {
  return data.reduce(
    (acc, item) => {
      acc.total_products++;
      acc.total_real += item.stock_real;
      acc.total_forecasted_in += item.stock_forecasted_in;
      acc.total_forecasted_out += item.stock_forecasted_out;
      if (item.stock_real <= 0) {
        acc.out_of_stock_count++;
      } else if (item.stock_real <= item.min_stock) {
        acc.low_stock_count++;
      }
      if (item.stock_available <= item.min_stock) {
        acc.forecasted_shortage_count++;
      }
      return acc;
    },
    {
      total_products: 0,
      total_stock_value: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      forecasted_shortage_count: 0,
      total_real: 0,
      total_forecasted_in: 0,
      total_forecasted_out: 0,
    }
  );
}
