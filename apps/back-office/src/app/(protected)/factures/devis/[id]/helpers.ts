import type { QontoQuoteDetail } from './types';

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatAmountCents(
  cents: number | undefined | null,
  currency = 'EUR'
): string {
  if (cents === undefined || cents === null) return '-';
  const amount = cents / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(
    amount
  );
}

export function formatVatRate(vatRate: string | number | undefined): string {
  if (vatRate === undefined || vatRate === null) return '-';
  const rate = typeof vatRate === 'string' ? parseFloat(vatRate) : vatRate;
  const percentage = rate < 1 ? rate * 100 : rate;
  return `${percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%`;
}

export function computeQuoteTotals(quote: QontoQuoteDetail) {
  if (
    quote.subtotal_amount_cents !== undefined &&
    quote.subtotal_amount_cents !== null
  ) {
    return {
      subtotalCents: quote.subtotal_amount_cents,
      vatCents: quote.total_vat_amount_cents ?? 0,
      totalCents: quote.total_amount_cents ?? 0,
    };
  }
  let subtotalHt = 0;
  let totalVat = 0;
  for (const item of quote.items) {
    const qty = parseFloat(item.quantity || '0');
    const unitPrice = parseFloat(item.unit_price?.value || '0');
    const vatRate =
      typeof item.vat_rate === 'string'
        ? parseFloat(item.vat_rate)
        : (item.vat_rate ?? 0);
    const lineHt = qty * unitPrice;
    subtotalHt += lineHt;
    totalVat += lineHt * vatRate;
  }
  return {
    subtotalCents: Math.round(subtotalHt * 100),
    vatCents: Math.round(totalVat * 100),
    totalCents:
      quote.total_amount_cents ?? Math.round((subtotalHt + totalVat) * 100),
  };
}
