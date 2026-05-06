'use client';

import { useMemo } from 'react';

import { Card, CardContent } from '@verone/ui';

import type { ICustomLine, IOrderForDocument } from '../OrderSelectModal';
import { formatAmount } from './utils';
import { computeFinancialTotals } from '@verone/finance/lib/finance-totals';
import type {
  FinancialItem,
  FinancialFees,
} from '@verone/finance/lib/finance-totals';

interface IInvoiceTotalsSectionProps {
  order: IOrderForDocument;
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
  customLines: ICustomLine[];
}

export function InvoiceTotalsSection({
  order,
  shippingCostHt,
  handlingCostHt,
  insuranceCostHt,
  feesVatRate,
  customLines,
}: IInvoiceTotalsSectionProps): React.ReactNode {
  const totals = useMemo(() => {
    const items: FinancialItem[] = [
      ...(order.sales_order_items ?? []).map(item => ({
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tax_rate: item.tax_rate,
        description: item.products?.name ?? 'Article',
      })),
      ...customLines.map(line => ({
        quantity: line.quantity,
        unit_price_ht: line.unit_price_ht,
        tax_rate: line.vat_rate,
        description: line.title,
      })),
    ];

    const feesData: FinancialFees = {
      shipping_cost_ht: shippingCostHt,
      handling_cost_ht: handlingCostHt,
      insurance_cost_ht: insuranceCostHt,
      fees_vat_rate: feesVatRate,
    };

    return computeFinancialTotals(items, feesData, { strict: false });
  }, [
    order.sales_order_items,
    customLines,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    feesVatRate,
  ]);

  const totalFees = totals.feesHt;
  const customLinesTotal = customLines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price_ht,
    0
  );
  // Articles = HT items hors custom lines
  const articlesHt = totals.itemsHt - customLinesTotal;

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Articles commande</span>
            <span>{formatAmount(articlesHt)}</span>
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
            <span className="font-medium">{formatAmount(totals.totalHt)}</span>
          </div>
          {Object.entries(totals.vatByRate)
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
            <span>{formatAmount(totals.totalTtc)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
