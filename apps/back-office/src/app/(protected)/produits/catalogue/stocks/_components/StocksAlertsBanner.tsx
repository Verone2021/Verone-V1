'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { AlertTriangle } from 'lucide-react';

interface StockAlert {
  product_id: string;
  product_name?: string;
  product_sku?: string;
  alert_type: string;
  alert_message: string;
}

interface StocksAlertsBannerProps {
  alerts: StockAlert[];
}

export function StocksAlertsBanner({ alerts }: StocksAlertsBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <Card className="border-gray-300 bg-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <AlertTriangle className="h-5 w-5" />
          Alertes Stock ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.slice(0, 3).map(alert => (
            <div
              key={alert.product_id}
              className="flex items-center justify-between p-2 bg-white rounded"
            >
              <div>
                <span className="font-medium">{alert.product_name}</span>
                <span className="text-sm text-gray-600 ml-2">
                  ({alert.product_sku})
                </span>
              </div>
              <Badge
                variant={
                  alert.alert_type === 'critical' ? 'destructive' : 'secondary'
                }
              >
                {alert.alert_message}
              </Badge>
            </div>
          ))}
          {alerts.length > 3 && (
            <p className="text-sm text-gray-900">
              Et {alerts.length - 3} autre(s) alerte(s)...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
