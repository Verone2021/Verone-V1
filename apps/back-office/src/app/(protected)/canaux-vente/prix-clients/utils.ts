import type { CustomerPricing, PrixClientsStats } from './types';

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function calculateStats(data: CustomerPricing[]): PrixClientsStats {
  const activeRules = data.filter(r => r.is_active);
  const uniqueCustomers = new Set(data.map(r => r.customer_id)).size;
  const avgDiscount =
    data.length > 0
      ? data.reduce((sum, r) => sum + (r.discount_rate ?? 0), 0) / data.length
      : 0;
  const totalRetrocession = data.reduce(
    (sum, r) => sum + (r.retrocession_rate ?? 0),
    0
  );

  return {
    total_pricing_rules: data.length,
    active_rules: activeRules.length,
    customers_with_pricing: uniqueCustomers,
    avg_discount: avgDiscount,
    total_retrocession: totalRetrocession,
  };
}
