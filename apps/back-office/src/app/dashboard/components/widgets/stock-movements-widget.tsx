'use client';

/**
 * Widget: Mouvements stock
 * Affiche les 10 derniers mouvements de stock
 *
 * @created 2026-01-12
 */

import Link from 'next/link';

import { useStockMovements } from '@verone/stock/hooks';
import { Badge } from '@verone/ui';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

import { WidgetCard } from './widget-card';
import { WIDGET_CATALOG } from '../../lib/widget-catalog';

const widget = WIDGET_CATALOG.stock_movements;

const MOVEMENT_TYPES: Record<
  string,
  { label: string; color: string; icon: typeof ArrowUpCircle }
> = {
  in: {
    label: 'Entrée',
    color: 'bg-green-100 text-green-800',
    icon: ArrowUpCircle,
  },
  out: {
    label: 'Sortie',
    color: 'bg-red-100 text-red-800',
    icon: ArrowDownCircle,
  },
  adjustment: {
    label: 'Ajustement',
    color: 'bg-blue-100 text-blue-800',
    icon: RefreshCw,
  },
};

interface StockMovementsWidgetProps {
  onRemove?: () => void;
}

export function StockMovementsWidget({ onRemove }: StockMovementsWidgetProps) {
  const { movements, loading, fetchMovements } = useStockMovements();

  return (
    <WidgetCard
      widget={widget}
      isLoading={loading}
      onRefresh={() => fetchMovements()}
      onRemove={onRemove}
      linkTo="/stocks/mouvements"
    >
      <div className="space-y-2">
        {movements?.slice(0, 10).map(movement => {
          const type = movement.quantity_change > 0 ? 'in' : 'out';
          const typeInfo = MOVEMENT_TYPES[type];
          const Icon = typeInfo.icon;

          return (
            <Link
              key={movement.id}
              href={`/produits/catalogue/${movement.product_id}`}
              className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${type === 'in' ? 'text-green-600' : 'text-red-600'}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {movement.products?.name || 'Produit inconnu'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {movement.reference_type || 'Manuel'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-2">
                <Badge variant="secondary" className={typeInfo.color}>
                  {movement.quantity_change > 0 ? '+' : ''}
                  {movement.quantity_change}
                </Badge>
                <p className="text-xs text-muted-foreground w-16 text-right">
                  {formatDistanceToNow(new Date(movement.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </Link>
          );
        })}

        {movements?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun mouvement récent
          </p>
        )}
      </div>
    </WidgetCard>
  );
}
