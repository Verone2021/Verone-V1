'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStockStatus, type StockStatusData } from '@/hooks/use-stock-status';

interface StockStatusSectionProps {
  product: StockStatusData & { id: string; name?: string };
  className?: string;
}

/**
 * Section affichant le statut stock automatique (LECTURE SEULE)
 *
 * Calculé automatiquement côté frontend selon stock_real et stock_forecasted_in
 * Non modifiable par l'utilisateur
 */
export function StockStatusSection({
  product,
  className,
}: StockStatusSectionProps) {
  const stockStatus = useStockStatus(product);

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900">Statut Stock</h3>
        </div>

        {/* Badge Statut */}
        <Badge variant={stockStatus.variant} className="text-sm font-medium">
          {stockStatus.icon} {stockStatus.label}
        </Badge>
      </div>

      {/* Description */}
      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-sm text-gray-600">{stockStatus.description}</p>
        <p className="mt-1 text-xs text-gray-500">
          ℹ️ Statut calculé automatiquement (lecture seule)
        </p>
      </div>

      {/* Détails Stock */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Stock réel</span>
          <p className="font-medium text-gray-900">
            {product.stock_real} unités
          </p>
        </div>
        <div>
          <span className="text-gray-500">Stock prévisionnel</span>
          <p className="font-medium text-gray-900">
            {product.stock_forecasted_in} unités
          </p>
        </div>
      </div>
    </div>
  );
}
