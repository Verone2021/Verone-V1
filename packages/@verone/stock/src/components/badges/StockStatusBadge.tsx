import { Package, AlertTriangle, XCircle } from 'lucide-react';

import { Badge } from '@verone/ui';

interface StockStatusBadgeProps {
  stockReal: number;
  stockForecastedOut: number;
  minStock: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StockStatusBadge({
  stockReal,
  stockForecastedOut,
  minStock,
  size: _size = 'md',
}: StockStatusBadgeProps) {
  const available = stockReal - stockForecastedOut;

  // Déterminer statut
  let _status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'ordered';
  let label: string;
  let icon: React.ReactNode;
  let className: string;

  if (stockReal <= 0 && stockForecastedOut > 0) {
    _status = 'ordered';
    label = 'Commandé Sans Stock';
    icon = <AlertTriangle className="h-3 w-3" />;
    className = 'border-red-600 text-red-600 bg-red-50';
  } else if (stockReal <= 0) {
    _status = 'out_of_stock';
    label = 'Rupture';
    icon = <XCircle className="h-3 w-3" />;
    className = 'border-red-600 text-red-600';
  } else if (available < minStock) {
    _status = 'low_stock';
    label = 'Stock Faible';
    icon = <AlertTriangle className="h-3 w-3" />;
    className = 'border-orange-600 text-orange-600';
  } else {
    _status = 'in_stock';
    label = 'En Stock';
    icon = <Package className="h-3 w-3" />;
    className = 'border-green-600 text-green-600';
  }

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      {icon}
      <span>{label}</span>
    </Badge>
  );
}
