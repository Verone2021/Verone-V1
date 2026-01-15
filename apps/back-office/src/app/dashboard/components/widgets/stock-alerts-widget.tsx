'use client';

/**
 * Widget: Alertes stock
 * Affiche les produits en stock critique ou épuisé
 *
 * @created 2026-01-12
 */

import Link from 'next/link';

import { useStockAlerts } from '@verone/stock/hooks';
import { Badge } from '@verone/ui';

import { WidgetCard } from './widget-card';
import { WIDGET_CATALOG } from '../../lib/widget-catalog';

const widget = WIDGET_CATALOG.stock_alerts;

interface StockAlertsWidgetProps {
  onRemove?: () => void;
}

export function StockAlertsWidget({ onRemove }: StockAlertsWidgetProps) {
  const { alerts, loading, fetchAlerts } = useStockAlerts();

  return (
    <WidgetCard
      widget={widget}
      isLoading={loading}
      onRefresh={() => fetchAlerts()}
      onRemove={onRemove}
      linkTo="/stocks/alertes"
    >
      <div className="space-y-3">
        {alerts?.slice(0, 5).map(alert => (
          <Link
            key={alert.id}
            href={`/produits/catalogue/${alert.product_id}`}
            className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {alert.product_name || 'Produit inconnu'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {alert.sku || alert.product_id?.slice(0, 8)}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <AlertBadge
                stockReal={alert.stock_real}
                minStock={alert.min_stock}
              />
              <div className="text-right">
                <p className="text-sm font-medium">{alert.stock_real} unités</p>
                <p className="text-xs text-muted-foreground">
                  Min: {alert.min_stock}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {alerts?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune alerte stock
          </p>
        )}
      </div>
    </WidgetCard>
  );
}

interface AlertBadgeProps {
  stockReal: number;
  minStock: number;
}

function AlertBadge({ stockReal, minStock }: AlertBadgeProps) {
  if (stockReal === 0) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        Épuisé
      </Badge>
    );
  }

  if (stockReal <= 2) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Critique
      </Badge>
    );
  }

  if (stockReal <= minStock) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Bas
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-green-100 text-green-800">
      OK
    </Badge>
  );
}
