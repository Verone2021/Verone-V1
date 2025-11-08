'use client';

import { Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@verone/utils';
import {
  useStockStatus,
  type StockStatusData,
} from '@/shared/modules/stock/hooks';

interface StockStatusCompactProps {
  product: StockStatusData & { id: string };
  className?: string;
}

/**
 * Version compacte du statut stock (60px height)
 * Affichage : Label + badge dot coloré
 * Lecture seule - Calcul automatique frontend
 */
export function StockStatusCompact({
  product,
  className,
}: StockStatusCompactProps) {
  const stockStatus = useStockStatus(product);

  return (
    <div
      className={cn(
        'flex items-center justify-between h-[60px] px-3 py-2',
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {/* Label avec icône */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50">
          <Package className="h-3.5 w-3.5 text-purple-600" />
        </div>
        <span className="text-sm font-medium text-gray-900">
          Statut de stock
        </span>
      </div>

      {/* Badge compact avec dot */}
      <Badge
        variant={stockStatus.variant}
        className="text-[10px] px-2 py-0.5 font-medium"
      >
        <span className="mr-1.5">{stockStatus.icon}</span>
        {stockStatus.label}
      </Badge>
    </div>
  );
}
