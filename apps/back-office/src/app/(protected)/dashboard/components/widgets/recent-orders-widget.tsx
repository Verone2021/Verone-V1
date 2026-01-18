'use client';

/**
 * Widget: Commandes récentes
 * Affiche les 5 dernières commandes clients
 *
 * @created 2026-01-12
 */

import { useEffect } from 'react';

import Link from 'next/link';

import { useSalesOrders } from '@verone/orders/hooks';
import { Badge } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import { WidgetCard } from './widget-card';
import { WIDGET_CATALOG } from '../../lib/widget-catalog';

const widget = WIDGET_CATALOG.recent_orders;

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  partially_shipped: 'Partielle',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

interface RecentOrdersWidgetProps {
  onRemove?: () => void;
}

export function RecentOrdersWidget({ onRemove }: RecentOrdersWidgetProps) {
  const { orders, loading, fetchOrders } = useSalesOrders();

  // Charger les commandes au montage
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <WidgetCard
      widget={widget}
      isLoading={loading}
      onRefresh={() => fetchOrders()}
      onRemove={onRemove}
      linkTo="/commandes/clients"
    >
      <div className="space-y-3">
        {orders?.slice(0, 5).map(order => (
          <Link
            key={order.id}
            href={`/commandes/clients/${order.id}`}
            className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {order.order_number || `SO-${order.id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {order.organisations?.legal_name ||
                  order.individual_customers?.first_name ||
                  'Client'}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <Badge
                variant="secondary"
                className={STATUS_COLORS[order.status] || 'bg-gray-100'}
              >
                {STATUS_LABELS[order.status] || order.status}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatPrice(order.total_ttc || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(order.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {orders?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune commande récente
          </p>
        )}
      </div>
    </WidgetCard>
  );
}
