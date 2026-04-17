import React from 'react';

import { Badge } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';

import { StockAlertCard } from '@/components/business/stock-alert-card';

import type { StockAlert } from '../types';

type AlertCardParam = Parameters<
  NonNullable<React.ComponentProps<typeof StockAlertCard>['onActionClick']>
>[0];

type CardAlertType = AlertCardParam['alert_type'];

interface AlertsListCardProps {
  filteredAlerts: StockAlert[];
  loading: boolean;
  title: string;
  description: string;
  emptyIcon: React.ReactNode;
  emptyMessage: string;
  emptySubMessage: string;
  onActionClick: (alert: AlertCardParam) => void;
}

const PRIORITY_ORDER: Record<CardAlertType, number> = {
  out_of_stock: 3,
  low_stock: 2,
  low_stock_forecast: 1,
  no_stock_but_ordered: 0,
};

function mapAlertType(a: StockAlert): CardAlertType {
  if (a.alert_type === 'low_stock_forecast') return 'low_stock_forecast';
  if (a.title === 'Rupture de stock') return 'out_of_stock';
  if (a.title === 'Stock faible') return 'low_stock';
  return 'no_stock_but_ordered';
}

export function AlertsListCard({
  filteredAlerts,
  loading,
  title,
  description,
  emptyIcon,
  emptyMessage,
  emptySubMessage,
  onActionClick,
}: AlertsListCardProps) {
  // A4 : grouper par product_id, une carte par produit avec badges multiples
  const groupedByProduct = React.useMemo(() => {
    const map = new Map<string, StockAlert[]>();
    for (const alert of filteredAlerts) {
      const key = alert.productId ?? alert.id;
      const arr = map.get(key) ?? [];
      arr.push(alert);
      map.set(key, arr);
    }
    return Array.from(map.values()).map(alerts => {
      // Alerte principale = priorité max
      const sorted = [...alerts].sort(
        (a, b) =>
          PRIORITY_ORDER[mapAlertType(b)] - PRIORITY_ORDER[mapAlertType(a)]
      );
      return {
        primary: sorted[0],
        additionalTypes: sorted.slice(1).map(mapAlertType),
      };
    });
  }, [filteredAlerts]);

  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {title} ({groupedByProduct.length})
          </span>
          {loading && (
            <Badge variant="outline" className="border-blue-300 text-blue-600">
              Actualisation...
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {groupedByProduct.length === 0 ? (
          <div className="text-center py-8">
            {emptyIcon}
            <p className="text-gray-500 mb-4">{emptyMessage}</p>
            <p className="text-sm text-gray-400">{emptySubMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByProduct.map(({ primary, additionalTypes }) => (
              <StockAlertCard
                key={primary.productId ?? primary.id}
                alert={{
                  id: primary.id,
                  product_id: primary.productId ?? '',
                  product_name: primary.productName ?? '',
                  sku: primary.productSku ?? '',
                  stock_real: primary.currentStock ?? 0,
                  stock_forecasted_in: primary.stock_forecasted_in ?? 0,
                  stock_forecasted_out: primary.stock_forecasted_out ?? 0,
                  min_stock: primary.minStock ?? 0,
                  shortage_quantity: primary.shortage_quantity ?? 0,
                  alert_type: mapAlertType(primary),
                  severity: primary.severity,
                  is_in_draft: primary.is_in_draft,
                  quantity_in_draft: primary.quantity_in_draft,
                  draft_order_id: primary.draft_order_id,
                  draft_order_number: primary.draft_order_number,
                  validated: primary.validated ?? false,
                  validated_at: primary.validated_at ?? null,
                }}
                additionalAlertTypes={additionalTypes}
                onActionClick={onActionClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
