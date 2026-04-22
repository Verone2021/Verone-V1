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

/**
 * Vrai si toutes les quantités commandées ont été réservées par des shipments
 * (incl. Packlink `a_payer`). Permet de distinguer "commande complètement
 * expédiée" de "commande partiellement expédiée" pour afficher/masquer le
 * bouton "Nouvelle expédition" (scénario multi-colis Packlink).
 */
function isOrderFullyShipped(
  order: SalesOrder,
  shipmentHistory: ShipmentHistoryItem[]
): boolean {
  const totalOrdered =
    order.sales_order_items?.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0
    ) ?? 0;
  if (totalOrdered === 0) return false;
  const totalShipped = shipmentHistory.reduce(
    (sum, h) =>
      sum + h.items.reduce((s, i) => s + (i.quantity_shipped ?? 0), 0),
    0
  );
  return totalShipped >= totalOrdered;
}

export interface OrderShipmentStatusCardProps {
  order: SalesOrder;
  shipmentHistory: ShipmentHistoryItem[];
  readOnly: boolean;
  canShip: boolean;
  onOpenShipmentModal?: () => void;
}

export function OrderShipmentStatusCard({
  order,
  shipmentHistory,
  readOnly,
  canShip,
  onOpenShipmentModal,
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
            {(() => {
              const firstToPay = shipmentHistory.find(
                h => h.packlink_status === 'a_payer'
              );
              const packlinkUrl = firstToPay?.packlink_shipment_id
                ? `https://pro.packlink.fr/private/shipments/${firstToPay.packlink_shipment_id}/create/address`
                : 'https://pro.packlink.fr/private/shipments';
              return (
                <a
                  href={packlinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-xs text-orange-700 hover:text-orange-900 underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Payer sur Packlink PRO
                </a>
              );
            })()}
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

        {/* Bouton "Nouvelle expédition" — visible tant que des articles restent
            à expédier (pas juste quand aucun shipment). Permet de créer des
            shipments partiels successifs (1 par colis) : le wizard utilise
            usePreviousShipments pour soustraire les quantités déjà réservées. */}
        {!readOnly &&
          canShip &&
          !isOrderFullyShipped(order, shipmentHistory) &&
          onOpenShipmentModal && (
            <ButtonV2
              size="sm"
              className="w-full"
              onClick={onOpenShipmentModal}
            >
              <Truck className="h-3 w-3 mr-1" />
              Nouvelle expédition
            </ButtonV2>
          )}
      </CardContent>
    </Card>
  );
}
