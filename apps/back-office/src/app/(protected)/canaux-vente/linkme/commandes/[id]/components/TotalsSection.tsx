'use client';

import { Card, CardContent } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

interface TotalsSectionProps {
  totalHt: number;
  totalTtc: number;
  notes: string | null;
}

export function TotalsSection({
  totalHt,
  totalTtc,
  notes,
}: TotalsSectionProps) {
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
        {notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-xs text-gray-600">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
