'use client';

import { Card, CardContent, Separator } from '@verone/ui';

import type { InvoiceDetail } from './types';
import { formatAmount } from './utils';

interface InvoiceTotalsCardProps {
  invoice: InvoiceDetail;
}

export function InvoiceTotalsCard({
  invoice,
}: InvoiceTotalsCardProps): React.ReactNode {
  // Calculate VAT breakdown by rate
  const vatBreakdown = invoice.items.reduce(
    (acc, item) => {
      const rate = item.tva_rate;
      if (!acc[rate]) {
        acc[rate] = { totalHt: 0, totalVat: 0 };
      }
      acc[rate].totalHt += item.total_ht;
      acc[rate].totalVat += item.tva_amount;
      return acc;
    },
    {} as Record<number, { totalHt: number; totalVat: number }>
  );

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total HT</span>
              <span className="font-medium">
                {formatAmount(invoice.total_ht)}
              </span>
            </div>

            {vatBreakdown &&
              Object.entries(vatBreakdown)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([rate, { totalVat }]) => (
                  <div key={rate} className="flex justify-between">
                    <span className="text-muted-foreground">
                      TVA {Math.round(Number(rate))}%
                    </span>
                    <span>{formatAmount(totalVat)}</span>
                  </div>
                ))}

            <Separator />

            <div className="flex justify-between text-base font-bold">
              <span>Total TTC</span>
              <span>{formatAmount(invoice.total_ttc)}</span>
            </div>

            {invoice.amount_paid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Deja paye</span>
                  <span>- {formatAmount(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Reste a payer</span>
                  <span>
                    {formatAmount(invoice.total_ttc - invoice.amount_paid)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
