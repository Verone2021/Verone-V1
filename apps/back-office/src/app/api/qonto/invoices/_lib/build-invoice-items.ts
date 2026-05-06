import { toQontoLines } from '@verone/finance/lib/finance-totals';
import type {
  FinancialItem,
  FinancialFees,
} from '@verone/finance/lib/finance-totals';

import type {
  ISalesOrderWithCustomer,
  IFeesData,
  ICustomLine,
  IInvoiceItem,
} from './types';

export function buildInvoiceItems(
  order: ISalesOrderWithCustomer,
  fees: IFeesData | undefined,
  customLines: ICustomLine[] | undefined
): IInvoiceItem[] {
  // Déterminer la TVA des frais (priorité: body > commande > défaut 20%)
  const feesVatRate = fees?.fees_vat_rate ?? order.fees_vat_rate ?? 0.2;

  // Convertir les items de la commande en FinancialItem
  const financialItems: FinancialItem[] = (order.sales_order_items ?? []).map(
    item => ({
      quantity: item.quantity ?? 1,
      unit_price_ht: item.unit_price_ht ?? 0,
      tax_rate: item.tax_rate, // null accepté — strict: false en aval
      description: item.products?.name ?? 'Article',
    })
  );

  // Métadonnées pour les lignes Qonto (product_id, notes)
  const itemsMeta = (order.sales_order_items ?? []).map(item => ({
    product_id: item.products?.id,
    title: item.products?.name ?? 'Article',
    description: item.notes ?? undefined,
    unit: 'pièce',
  }));

  // Frais pour toQontoLines
  const financialFees: FinancialFees = {
    shipping_cost_ht: fees?.shipping_cost_ht ?? order.shipping_cost_ht ?? 0,
    handling_cost_ht: fees?.handling_cost_ht ?? order.handling_cost_ht ?? 0,
    insurance_cost_ht: fees?.insurance_cost_ht ?? order.insurance_cost_ht ?? 0,
    fees_vat_rate: feesVatRate,
  };

  // Construire les lignes via le module unique
  const qontoLines = toQontoLines(financialItems, financialFees, itemsMeta);

  // Ajouter les lignes personnalisées
  if (customLines && customLines.length > 0) {
    for (const line of customLines) {
      qontoLines.push({
        title: line.title,
        description: line.description,
        quantity: String(line.quantity),
        unit: 'pièce',
        unitPrice: {
          value: String(line.unit_price_ht),
          currency: 'EUR',
        },
        vatRate: String(line.vat_rate),
        unit_price_ht: line.unit_price_ht,
        quantity_num: line.quantity,
        vat_rate_num: line.vat_rate,
      });
    }
  }

  // Retourner au format IInvoiceItem (compatible avec le reste du code)
  return qontoLines.map(line => ({
    title: line.title,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    vatRate: line.vatRate,
    product_id: line.product_id,
    unit_price_ht: line.unit_price_ht,
    quantity_num: line.quantity_num,
    vat_rate_num: line.vat_rate_num,
  }));
}
