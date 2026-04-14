'use client';

import { Card, CardContent } from '@verone/ui';

import type { ICustomLine, IOrderForDocument } from '../OrderSelectModal';
import type { IQuoteFeesState } from './types';
import { formatAmount } from './quote-utils';

interface IQuoteTotalsSectionProps {
  order: IOrderForDocument;
  fees: IQuoteFeesState;
  customLines: ICustomLine[];
}

export function QuoteTotalsSection({
  order,
  fees,
  customLines,
}: IQuoteTotalsSectionProps): React.ReactNode {
  const { shippingCostHt, handlingCostHt, insuranceCostHt, feesVatRate } = fees;

  const vatByRate: Record<number, number> = {};
  let totalHt = 0;

  // 1. Articles de la commande
  order.sales_order_items?.forEach(item => {
    const rate = item.tax_rate || 0;
    const lineHt = item.quantity * item.unit_price_ht;
    const lineVat = lineHt * rate;
    totalHt += lineHt;
    vatByRate[rate] = (vatByRate[rate] || 0) + lineVat;
  });

  // 2. Frais de service
  const totalFees = shippingCostHt + handlingCostHt + insuranceCostHt;
  if (totalFees > 0) {
    totalHt += totalFees;
    const feesVat = totalFees * feesVatRate;
    vatByRate[feesVatRate] = (vatByRate[feesVatRate] || 0) + feesVat;
  }

  // 3. Lignes personnalisées
  customLines.forEach(line => {
    const lineHt = line.quantity * line.unit_price_ht;
    const lineVat = lineHt * line.vat_rate;
    totalHt += lineHt;
    vatByRate[line.vat_rate] = (vatByRate[line.vat_rate] || 0) + lineVat;
  });

  const totalVat = Object.values(vatByRate).reduce((sum, v) => sum + v, 0);
  const totalTtc = totalHt + totalVat;

  const articlesTotal =
    order.sales_order_items?.reduce(
      (sum, item) => sum + item.quantity * item.unit_price_ht,
      0
    ) ?? 0;

  const customLinesTotal = customLines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price_ht,
    0
  );

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Articles commande</span>
            <span>{formatAmount(articlesTotal)}</span>
          </div>
          {totalFees > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frais de service</span>
              <span>{formatAmount(totalFees)}</span>
            </div>
          )}
          {customLines.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Lignes personnalisées
              </span>
              <span>{formatAmount(customLinesTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-medium">Total HT</span>
            <span className="font-medium">{formatAmount(totalHt)}</span>
          </div>
          {Object.entries(vatByRate)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([rate, amount]) => (
              <div key={rate} className="flex justify-between">
                <span className="text-muted-foreground">
                  TVA {Math.round(Number(rate) * 100)}%
                </span>
                <span>{formatAmount(amount)}</span>
              </div>
            ))}
          <div className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
            <span>Total TTC</span>
            <span>{formatAmount(totalTtc)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
