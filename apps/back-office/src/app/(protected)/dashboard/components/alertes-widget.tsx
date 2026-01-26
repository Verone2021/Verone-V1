/**
 * AlertesWidget Component
 * Displays top 5 critical stock alerts
 */

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { DashboardMetrics } from '../actions/get-dashboard-metrics';

interface AlertesWidgetProps {
  alerts: DashboardMetrics['widgets']['stockAlerts'];
}

export function AlertesWidget({ alerts }: AlertesWidgetProps) {
  const severityConfig = {
    critical: { label: 'Critique', color: 'bg-red-100 text-red-800' },
    warning: { label: 'Attention', color: 'bg-orange-100 text-orange-800' },
    info: { label: 'Info', color: 'bg-blue-100 text-blue-800' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base">Alertes Stock Urgentes</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/stocks/alertes">Voir tout →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Aucune alerte stock urgente
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const severityLabel =
                severityConfig[alert.severity as keyof typeof severityConfig] ||
                severityConfig.info;

              return (
                <div
                  key={alert.product_id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-neutral-900 truncate">
                      {alert.product_name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Stock actuel:{' '}
                      <span className="font-semibold text-red-600">
                        {alert.stock_real}
                      </span>{' '}
                      / Seuil: {alert.min_stock}
                    </div>
                  </div>
                  <Badge className={severityLabel.color} variant="secondary">
                    {severityLabel.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
