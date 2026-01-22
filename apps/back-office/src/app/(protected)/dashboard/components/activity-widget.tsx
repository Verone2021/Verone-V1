/**
 * ActivityWidget Component
 * Timeline of last 10 recent orders
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
import { ShoppingCart } from 'lucide-react';
import type { DashboardMetrics } from '../actions/get-dashboard-metrics';

interface ActivityWidgetProps {
  orders: DashboardMetrics['widgets']['recentOrders'];
}

export function ActivityWidget({ orders }: ActivityWidgetProps) {
  const statusConfig = {
    draft: { label: 'Brouillon', color: 'bg-yellow-100 text-yellow-800' },
    validated: { label: 'Validée', color: 'bg-blue-100 text-blue-800' },
    partially_shipped: { label: 'Partiellement expédiée', color: 'bg-purple-100 text-purple-800' },
    shipped: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-800' },
    delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Activité Récente</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/commandes/clients">Voir tout →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Aucune commande récente
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusLabel =
                statusConfig[order.status as keyof typeof statusConfig] ||
                statusConfig.draft;

              return (
                <Link
                  key={order.id}
                  href={`/commandes/clients/${order.id}`}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-neutral-900">
                        {order.order_number}
                      </span>
                      <Badge
                        className={statusLabel.color}
                        variant="secondary"
                      >
                        {statusLabel.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-neutral-500 truncate">
                      {order.customer_type === 'organization' ? 'Organisation' : 'Particulier'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-neutral-900">
                        {formatPrice(order.total_ttc)}
                      </span>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
