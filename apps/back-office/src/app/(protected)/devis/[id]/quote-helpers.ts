import type { QontoAmount, QuoteItem } from './quote-types';

// Parse Qonto amount - handles both number and object formats
export function parseQontoAmount(
  amount: QontoAmount | undefined,
  fallbackCents?: number
): number {
  if (amount === undefined || amount === null) {
    return fallbackCents ? fallbackCents / 100 : 0;
  }
  if (typeof amount === 'number') {
    return amount;
  }
  if (typeof amount === 'object' && 'value' in amount) {
    return parseFloat(amount.value) || 0;
  }
  return 0;
}

export function formatAmount(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
}

export function parseItemUnitPrice(unitPrice: QuoteItem['unit_price']): number {
  if (typeof unitPrice === 'object' && unitPrice) {
    return parseFloat(unitPrice.value);
  }
  if (typeof unitPrice === 'number') {
    return unitPrice;
  }
  return 0;
}

export function parseItemQuantity(quantity: QuoteItem['quantity']): number {
  return typeof quantity === 'string' ? parseFloat(quantity) : quantity;
}

export function calcSubtotalFromItems(items: QuoteItem[]): number {
  return items.reduce((sum, item) => {
    const qty = parseItemQuantity(item.quantity);
    const unitPrice = parseItemUnitPrice(item.unit_price);
    return sum + qty * unitPrice;
  }, 0);
}

export function calcVatFromItems(items: QuoteItem[]): number {
  return items.reduce((sum, item) => {
    const qty = parseItemQuantity(item.quantity);
    const unitPrice = parseItemUnitPrice(item.unit_price);
    const vatRate =
      typeof item.vat_rate === 'string'
        ? parseFloat(item.vat_rate)
        : item.vat_rate;
    // Si vatRate < 1, c'est un pourcentage décimal (0.2 = 20%)
    const vatMultiplier = vatRate < 1 ? vatRate : vatRate / 100;
    return sum + qty * unitPrice * vatMultiplier;
  }, 0);
}
