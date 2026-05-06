/**
 * Helper de conversion vers le format Qonto
 *
 * Transforme les articles + frais en payload QontoLine pour les routes API.
 * Utilise computeFinancialTotals en interne pour garantir la cohérence des totaux.
 *
 * Sprint BO-FIN-046 — 2026-05-06
 */

import type { FinancialItem, FinancialFees, QontoLine } from './types';

// ---------------------------------------------------------------------------
// Conversion article → ligne Qonto
// ---------------------------------------------------------------------------

/**
 * Construire le tableau de lignes Qonto à partir des articles et des frais.
 *
 * Format Qonto : quantity et vatRate en string, unitPrice.value en string.
 * Ne calcule PAS les totaux — c'est computeFinancialTotals qui fait ça.
 *
 * @param items      Articles de la commande (avec tax_rate résolu)
 * @param fees       Frais annexes
 * @param itemsMeta  Métadonnées des articles (product_id, nom, notes)
 * @returns          Tableau de QontoLine prêt pour l'API Qonto
 */
export function toQontoLines(
  items: FinancialItem[],
  fees: FinancialFees,
  itemsMeta?: Array<{
    product_id?: string;
    title?: string;
    unit?: string;
    description?: string;
  }>
): QontoLine[] {
  const lines: QontoLine[] = [];

  // Articles
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const meta = itemsMeta?.[i];

    if ((item.quantity ?? 0) === 0) continue;

    const taxRate = item.tax_rate ?? 0;
    const qty = item.quantity ?? 0;
    const unitPriceHt = item.unit_price_ht ?? 0;

    lines.push({
      title: meta?.title ?? item.description ?? 'Article',
      description: meta?.description ?? item.description ?? undefined,
      quantity: String(qty),
      unit: meta?.unit ?? 'pièce',
      unitPrice: {
        value: String(unitPriceHt),
        currency: 'EUR',
      },
      vatRate: String(taxRate),
      unit_price_ht: unitPriceHt,
      quantity_num: qty,
      vat_rate_num: taxRate,
      product_id: meta?.product_id,
    });
  }

  // Frais de livraison
  const shippingHt = fees.shipping_cost_ht ?? 0;
  if (shippingHt > 0) {
    lines.push({
      title: 'Frais de livraison',
      quantity: '1',
      unit: 'forfait',
      unitPrice: { value: String(shippingHt), currency: 'EUR' },
      vatRate: String(fees.fees_vat_rate ?? 0),
      unit_price_ht: shippingHt,
      quantity_num: 1,
      vat_rate_num: fees.fees_vat_rate ?? 0,
    });
  }

  // Frais de manutention
  const handlingHt = fees.handling_cost_ht ?? 0;
  if (handlingHt > 0) {
    lines.push({
      title: 'Frais de manutention',
      quantity: '1',
      unit: 'forfait',
      unitPrice: { value: String(handlingHt), currency: 'EUR' },
      vatRate: String(fees.fees_vat_rate ?? 0),
      unit_price_ht: handlingHt,
      quantity_num: 1,
      vat_rate_num: fees.fees_vat_rate ?? 0,
    });
  }

  // Frais d'assurance
  const insuranceHt = fees.insurance_cost_ht ?? 0;
  if (insuranceHt > 0) {
    lines.push({
      title: "Frais d'assurance",
      quantity: '1',
      unit: 'forfait',
      unitPrice: { value: String(insuranceHt), currency: 'EUR' },
      vatRate: String(fees.fees_vat_rate ?? 0),
      unit_price_ht: insuranceHt,
      quantity_num: 1,
      vat_rate_num: fees.fees_vat_rate ?? 0,
    });
  }

  return lines;
}
