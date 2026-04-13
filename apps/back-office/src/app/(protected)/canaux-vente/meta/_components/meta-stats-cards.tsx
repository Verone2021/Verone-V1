'use client';

import {
  CheckCircle,
  Clock,
  Eye,
  MousePointerClick,
  Package,
  ShoppingCart,
  XCircle,
} from 'lucide-react';

import { useMetaCommerceStats } from '@verone/channels';
import { Card, CardContent } from '@verone/ui';

export function MetaStatsCards() {
  const { data: stats } = useMetaCommerceStats();

  const statusCards = [
    {
      label: 'Produits Meta',
      value: stats?.total_products ?? 0,
      icon: Package,
    },
    {
      label: 'Publies',
      value: stats?.active_products ?? 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      label: 'En attente',
      value: stats?.pending_products ?? 0,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      label: 'Rejetes',
      value: stats?.rejected_products ?? 0,
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  const metricsCards = [
    {
      label: 'Impressions',
      value: stats?.total_impressions ?? 0,
      icon: Eye,
    },
    {
      label: 'Clics',
      value: stats?.total_clicks ?? 0,
      icon: MousePointerClick,
    },
    {
      label: 'Conversions',
      value: stats?.total_conversions ?? 0,
      icon: ShoppingCart,
    },
    {
      label: 'Taux conversion',
      value: `${((stats?.conversion_rate ?? 0) * 100).toFixed(1)}%`,
      icon: CheckCircle,
    },
  ];

  const hasMetrics =
    (stats?.total_impressions ?? 0) > 0 || (stats?.total_clicks ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusCards.map(c => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <c.icon className={`h-4 w-4 ${c.color ?? ''}`} />
                {c.label}
              </div>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricsCards.map(c => (
            <Card key={c.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </div>
                <p className="text-2xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
