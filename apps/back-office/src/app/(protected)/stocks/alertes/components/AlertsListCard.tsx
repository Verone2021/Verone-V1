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
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {title} ({filteredAlerts.length})
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
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            {emptyIcon}
            <p className="text-gray-500 mb-4">{emptyMessage}</p>
            <p className="text-sm text-gray-400">{emptySubMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <StockAlertCard
                key={alert.id}
                alert={{
                  id: alert.id,
                  product_id: alert.productId ?? '',
                  product_name: alert.productName ?? '',
                  sku: alert.productSku ?? '',
                  stock_real: alert.currentStock ?? 0,
                  stock_forecasted_in: alert.stock_forecasted_in ?? 0,
                  stock_forecasted_out: alert.stock_forecasted_out ?? 0,
                  min_stock: alert.minStock ?? 0,
                  shortage_quantity: alert.shortage_quantity ?? 0,
                  alert_type:
                    alert.title === 'Rupture de stock'
                      ? 'out_of_stock'
                      : alert.title === 'Stock faible'
                        ? 'low_stock'
                        : 'no_stock_but_ordered',
                  severity: alert.severity,
                  is_in_draft: alert.is_in_draft,
                  quantity_in_draft: alert.quantity_in_draft,
                  draft_order_id: alert.draft_order_id,
                  draft_order_number: alert.draft_order_number,
                  validated: alert.validated ?? false,
                  validated_at: alert.validated_at ?? null,
                }}
                onActionClick={onActionClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
