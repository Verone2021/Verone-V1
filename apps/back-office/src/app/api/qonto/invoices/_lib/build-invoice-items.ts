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
  const items: IInvoiceItem[] = (order.sales_order_items ?? []).map(item => ({
    title: item.products?.name ?? 'Article',
    description: item.notes ?? undefined,
    quantity: String(item.quantity ?? 1),
    unit: 'pièce',
    unitPrice: {
      value: String(item.unit_price_ht ?? 0),
      currency: 'EUR',
    },
    vatRate: String(item.tax_rate ?? 0.2), // tax_rate est déjà en decimal (0.2 = 20%)
    // Pour stockage local
    product_id: item.products?.id,
    unit_price_ht: item.unit_price_ht ?? 0,
    quantity_num: item.quantity ?? 1,
    vat_rate_num: item.tax_rate ?? 0.2,
  }));

  // Déterminer la TVA des frais (priorité: body > commande > défaut 20%)
  const feesVatRate = fees?.fees_vat_rate ?? order.fees_vat_rate ?? 0.2;

  // Ajouter les frais de livraison
  const shippingCost = fees?.shipping_cost_ht ?? order.shipping_cost_ht ?? 0;
  if (shippingCost > 0) {
    items.push({
      title: 'Frais de livraison',
      description: undefined,
      quantity: '1',
      unit: 'forfait',
      unitPrice: {
        value: String(shippingCost),
        currency: 'EUR',
      },
      vatRate: String(feesVatRate),
      unit_price_ht: shippingCost,
      quantity_num: 1,
      vat_rate_num: feesVatRate,
    });
  }

  // Ajouter les frais de manutention
  const handlingCost = fees?.handling_cost_ht ?? order.handling_cost_ht ?? 0;
  if (handlingCost > 0) {
    items.push({
      title: 'Frais de manutention',
      description: undefined,
      quantity: '1',
      unit: 'forfait',
      unitPrice: {
        value: String(handlingCost),
        currency: 'EUR',
      },
      vatRate: String(feesVatRate),
      unit_price_ht: handlingCost,
      quantity_num: 1,
      vat_rate_num: feesVatRate,
    });
  }

  // Ajouter les frais d'assurance
  const insuranceCost = fees?.insurance_cost_ht ?? order.insurance_cost_ht ?? 0;
  if (insuranceCost > 0) {
    items.push({
      title: "Frais d'assurance",
      description: undefined,
      quantity: '1',
      unit: 'forfait',
      unitPrice: {
        value: String(insuranceCost),
        currency: 'EUR',
      },
      vatRate: String(feesVatRate),
      unit_price_ht: insuranceCost,
      quantity_num: 1,
      vat_rate_num: feesVatRate,
    });
  }

  // Ajouter les lignes personnalisées (custom lines)
  if (customLines && customLines.length > 0) {
    for (const line of customLines) {
      items.push({
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

  return items;
}
