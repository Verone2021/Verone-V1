'use client';

import { CreditCard, Truck } from 'lucide-react';

interface Props {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  totalHt: number | null;
  taxAmount: number | null;
  taxRate: number | null;
  formatCurrency: (amount: number) => string;
}

export function OrderTotalsSection({
  subtotal,
  discountAmount,
  shippingCost,
  total,
  totalHt,
  taxAmount,
  taxRate,
  formatCurrency,
}: Props) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Sous-total TTC
        </span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Reduction</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          Livraison
        </span>
        <span>
          {shippingCost > 0 ? formatCurrency(shippingCost) : 'Offerte'}
        </span>
      </div>
      <div className="flex justify-between font-semibold text-base border-t pt-2">
        <span>Total TTC</span>
        <span>{formatCurrency(total)}</span>
      </div>
      {totalHt != null && taxAmount != null && (
        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total HT</span>
            <span>{formatCurrency(totalHt)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>TVA ({taxRate ?? 20}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
