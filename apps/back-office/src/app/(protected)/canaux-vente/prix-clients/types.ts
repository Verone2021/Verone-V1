import type { CustomerPricing } from '@verone/finance';

export interface PrixClientsStats {
  total_pricing_rules: number;
  active_rules: number;
  customers_with_pricing: number;
  avg_discount: number;
  total_retrocession: number;
}

export type { CustomerPricing };
