export function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function resolveCustomerName(order: {
  organisations?: {
    legal_name?: string | null;
    trade_name?: string | null;
  } | null;
  individual_customers?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}): string {
  const legalName = order.organisations?.legal_name;
  const tradeName = order.organisations?.trade_name;
  if (legalName) {
    return tradeName && tradeName !== legalName
      ? `${legalName} (${tradeName})`
      : legalName;
  }
  return (
    `${order.individual_customers?.first_name ?? ''} ${order.individual_customers?.last_name ?? ''}`.trim() ||
    'Client'
  );
}
