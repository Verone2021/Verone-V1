'use client';

import { Card, CardContent } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

import type { QuoteTotals } from './types';

// =====================================================================
// PROPS
// =====================================================================

export interface TotalsSectionProps {
  totals: QuoteTotals;
  feesVatRate: number;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function TotalsSection({
  totals,
  feesVatRate,
}: TotalsSectionProps): React.ReactNode {
  return (
    <Card className="bg-gray-50">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total HT articles</span>
            <span>{formatCurrency(totals.itemsTotalHt)}</span>
          </div>
          {totals.feesTotalHt > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frais HT</span>
              <span>{formatCurrency(totals.feesTotalHt)}</span>
            </div>
          )}
          {/* TVA by rate */}
          {Object.entries(totals.tvaByRate).map(([rate, { tva }]) => (
            <div key={rate} className="flex justify-between text-sm">
              <span className="text-gray-600">TVA {rate}%</span>
              <span>{formatCurrency(tva)}</span>
            </div>
          ))}
          {totals.feesTva > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                TVA frais ({(feesVatRate * 100).toFixed(0)}%)
              </span>
              <span>{formatCurrency(totals.feesTva)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total TTC</span>
            <span className="text-lg">{formatCurrency(totals.totalTtc)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
