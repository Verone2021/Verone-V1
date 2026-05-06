'use client';

import { Card, CardContent, Separator } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

interface OrderItem {
  quantity: number;
  unit_price_ht: number;
  tax_rate?: number | null;
}

interface OrderTotalsCardProps {
  items: OrderItem[];
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
}

/**
 * Affiche les totaux de la commande de façon cohérente avec le modal facture.
 * Calcule explicitement : sous-total items, frais, TVA par taux, total TTC.
 *
 * Avant ce composant ne montrait que `total_ht` (items uniquement) et
 * `total_ttc` (TTC complet) → ratio illusoire (ex: 653 → 818 = +25 %).
 * Le calcul ci-dessous est strictement aligné avec
 * `packages/@verone/finance/src/components/InvoiceCreateFromOrderModal/InvoiceTotalsSection.tsx`
 * pour qu'aucune incohérence apparente ne subsiste entre la page commande et
 * le modal de création facture/devis.
 */
export function OrderTotalsCard({
  items,
  shippingCostHt,
  handlingCostHt,
  insuranceCostHt,
  feesVatRate,
}: OrderTotalsCardProps) {
  const vatByRate: Record<number, number> = {};
  let itemsHt = 0;

  for (const item of items) {
    const rate = item.tax_rate ?? 0;
    const lineHt = item.quantity * item.unit_price_ht;
    itemsHt += lineHt;
    vatByRate[rate] = (vatByRate[rate] ?? 0) + lineHt * rate;
  }

  const feesHt = shippingCostHt + handlingCostHt + insuranceCostHt;
  if (feesHt > 0) {
    vatByRate[feesVatRate] =
      (vatByRate[feesVatRate] ?? 0) + feesHt * feesVatRate;
  }

  const totalHt = itemsHt + feesHt;
  const totalVat = Object.values(vatByRate).reduce((sum, v) => sum + v, 0);
  const totalTtc = totalHt + totalVat;

  const vatEntries = Object.entries(vatByRate)
    .map(([rate, amount]) => ({ rate: Number(rate), amount }))
    .filter(e => e.amount > 0)
    .sort((a, b) => b.rate - a.rate);

  return (
    <Card>
      <CardContent className="p-4 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Sous-total articles</span>
          <span>{formatCurrency(itemsHt)}</span>
        </div>
        {feesHt > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Frais de service</span>
            <span>{formatCurrency(feesHt)}</span>
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total HT</span>
          <span className="font-medium">{formatCurrency(totalHt)}</span>
        </div>
        {vatEntries.map(({ rate, amount }) => (
          <div
            key={rate}
            className="flex items-center justify-between text-gray-600"
          >
            <span>TVA {Math.round(rate * 100)}%</span>
            <span>{formatCurrency(amount)}</span>
          </div>
        ))}
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="font-bold">Total TTC</span>
          <span className="font-bold text-lg">{formatCurrency(totalTtc)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
