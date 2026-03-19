'use client';

import { AlertTriangle } from 'lucide-react';

interface StockBadgeProps {
  stock: number;
}

export function StockBadge({ stock }: StockBadgeProps): React.JSX.Element {
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-500">
      <AlertTriangle className="h-3 w-3" />
      Rupture
    </span>
  );
}
