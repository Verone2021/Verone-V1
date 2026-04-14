/**
 * Types et constantes pour use-stock-analytics
 */

// ================== TYPES RPC ==================

export interface StockAnalyticsRaw {
  product_id: string;
  product_name: string;
  sku: string;
  product_image_url?: string | null;
  stock_current: number;
  stock_minimum: number;
  cost_price: number;
  out_30d: number;
  out_90d: number;
  out_365d: number;
  in_30d: number;
  in_90d: number;
  in_365d: number;
  adu: number;
  turnover_rate: number;
  coverage_days: number;
  days_inactive: number | null;
  movement_history: Array<{ date: string; qty: number; type: string }>;
  last_exit_date: string | null;
  last_entry_date: string | null;
}

// ================== CLASSIFICATIONS ==================

export type ABCClass = 'A' | 'B' | 'C';
export type XYZClass = 'X' | 'Y' | 'Z';

export const ABC_CLASSES = [
  {
    id: 'A' as const,
    label: 'Classe A',
    description: '80% de la valeur',
    threshold: 0.8,
    color: 'bg-green-100',
    textColor: 'text-green-800',
    priority: 'Critique',
  },
  {
    id: 'B' as const,
    label: 'Classe B',
    description: '15% de la valeur',
    threshold: 0.95,
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    priority: 'Important',
  },
  {
    id: 'C' as const,
    label: 'Classe C',
    description: '5% de la valeur',
    threshold: 1.0,
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    priority: 'Faible',
  },
] as const;

export const XYZ_CLASSES = [
  {
    id: 'X' as const,
    label: 'Classe X',
    description: 'Demande stable (CV < 0.5)',
    threshold: 0.5,
    color: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    priority: 'Prévisible',
  },
  {
    id: 'Y' as const,
    label: 'Classe Y',
    description: 'Demande fluctuante (0.5 ≤ CV < 1.0)',
    threshold: 1.0,
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    priority: 'Modéré',
  },
  {
    id: 'Z' as const,
    label: 'Classe Z',
    description: 'Demande irrégulière (CV ≥ 1.0)',
    threshold: Infinity,
    color: 'bg-red-100',
    textColor: 'text-red-800',
    priority: 'Imprévisible',
  },
] as const;

// ================== PRODUCT ENRICHI ==================

export interface ProductAnalytics extends StockAnalyticsRaw {
  stock_value: number;
  cumulative_value: number;
  cumulative_value_percentage: number;

  abc_class: ABCClass;
  abc_rank: number;

  xyz_class: XYZClass;
  xyz_cv: number;
  xyz_stddev: number;
  xyz_mean: number;

  combined_class: string;
}

// ================== SUMMARY DATA ==================

export interface AnalyticsSummary {
  total_products: number;
  total_quantity: number;
  total_value: number;

  abc_a_count: number;
  abc_b_count: number;
  abc_c_count: number;
  abc_a_value_percentage: number;
  abc_b_value_percentage: number;
  abc_c_value_percentage: number;

  xyz_x_count: number;
  xyz_y_count: number;
  xyz_z_count: number;

  average_adu: number;
  average_turnover_rate: number;
  average_coverage_days: number;
  products_below_minimum: number;
  products_inactive_30d: number;
}

export interface AnalyticsClassData {
  class_id: string;
  label: string;
  description: string;
  count: number;
  quantity: number;
  value: number;
  percentage: number;
  color: string;
  textColor: string;
  priority: string;
}

export interface AnalyticsReport {
  summary: AnalyticsSummary;
  products: ProductAnalytics[];
  abc_classes: AnalyticsClassData[];
  xyz_classes: AnalyticsClassData[];
  combined_matrix: Record<string, ProductAnalytics[]>;
  top_20_high_value: ProductAnalytics[];
  top_20_low_turnover: ProductAnalytics[];
  top_20_high_adu: ProductAnalytics[];
  generated_at: string;
}

// ================== HELPERS ==================

export function calculateCoefficientOfVariation(values: number[]): {
  cv: number;
  mean: number;
  stddev: number;
} {
  if (values.length === 0) return { cv: 0, mean: 0, stddev: 0 };

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

  if (mean === 0) return { cv: 0, mean: 0, stddev: 0 };

  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  const stddev = Math.sqrt(variance);
  const cv = stddev / mean;

  return { cv, mean, stddev };
}
