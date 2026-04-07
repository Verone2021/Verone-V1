'use client';

import { Badge } from '@verone/ui';

interface StockBadgeProps {
  stock: number;
}

export function StockBadge({ stock }: StockBadgeProps) {
  if (stock > 10) {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-green-50 text-green-700 border-green-200"
      >
        {stock} en stock
      </Badge>
    );
  } else if (stock > 0) {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-orange-50 text-orange-700 border-orange-200"
      >
        {stock} restant
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-red-50 text-red-700 border-red-200"
      >
        Rupture
      </Badge>
    );
  }
}
