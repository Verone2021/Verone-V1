'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Truck, ExternalLink } from 'lucide-react';

import type { SalesOrder } from '@verone/orders/hooks';

import type { ShipmentHistoryItem } from './OrderShipmentHistoryCard';

function formatDate(date: string | null): string {
  if (!date) return 'Non définie';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export interface OrderShipmentStatusCardProps {
  order: SalesOrder;
  shipmentHistory: ShipmentHistoryItem[];
  readOnly: boolean;
  canShip: boolean;
}

export function OrderShipmentStatusCard({
  order,
  shipmentHistory,
  readOnly,
  canShip,
}: OrderShipmentStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Truck className="h-3 w-3" />
          Expédition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {order.delivered_at ? (
          <Badge
            variant="secondary"
            className="w-full justify-center bg-green-100 text-green-800 border-green-200"
          >
            Livrée le {formatDate(order.delivered_at)}
          </Badge>
        ) : (order.status as string) === 'delivered' ? (
          <Badge
            variant="secondary"
            className="w-full justify-center bg-green-100 text-green-800 border-green-200"
          >
            Livrée
          </Badge>
        ) : order.shipped_at ? (
          <Badge
            variant="secondary"
            className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200"
          >
            Expédiée le {formatDate(order.shipped_at)}
          </Badge>
        ) : order.status === 'shipped' ? (
          <Badge
            variant="secondary"
            className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200"
          >
            Expédiée
          </Badge>
        ) : order.status === 'partially_shipped' ? (
          <Badge
            variant="secondary"
            className="w-full justify-center bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            Partiellement expédiée
          </Badge>
        ) : shipmentHistory.length > 0 &&
          shipmentHistory.some(h => h.packlink_status === 'a_payer') ? (
          <div className="space-y-2">
            <Badge
              variant="secondary"
              className="w-full justify-center bg-orange-100 text-orange-800 border-orange-200"
            >
              Transport à payer (Packlink)
            </Badge>
            <a
              href="https://pro.packlink.fr/private/shipments"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-orange-700 hover:text-orange-900 underline"
            >
              <ExternalLink className="h-3 w-3" />
              Payer sur Packlink PRO
            </a>
          </div>
        ) : shipmentHistory.length > 0 ? (
          <Badge
            variant="secondary"
            className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200"
          >
            Expédition en cours
          </Badge>
        ) : (
          <p className="text-center text-xs text-gray-500">
            Pas encore expédiée
          </p>
        )}

        {!readOnly && canShip && shipmentHistory.length === 0 && (
          <ButtonV2
            size="sm"
            className="w-full"
            disabled
            title="Fonctionnalité en cours de développement"
          >
            <Truck className="h-3 w-3 mr-1" />
            Gérer expédition
          </ButtonV2>
        )}
      </CardContent>
    </Card>
  );
}
