'use client';

import { Card, CardContent } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

interface OrderTotalsCardProps {
  totalHt: number;
  totalTtc: number;
}

export function OrderTotalsCard({ totalHt, totalTtc }: OrderTotalsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Total HT</span>
          <span className="text-sm font-medium">{formatCurrency(totalHt)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-200">
          <span className="font-bold">Total TTC</span>
          <span className="font-bold text-lg">{formatCurrency(totalTtc)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
