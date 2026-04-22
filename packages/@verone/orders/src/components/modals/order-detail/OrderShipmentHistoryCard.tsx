'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { History, CheckCircle2, ExternalLink, Mail } from 'lucide-react';

import type { SalesOrder } from '@verone/orders/hooks';

export interface ShipmentHistoryItem {
  shipped_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  delivery_method: string | null;
  carrier_name: string | null;
  carrier_service: string | null;
  shipping_cost: number | null;
  packlink_status: string | null;
  packlink_shipment_id: string | null;
  label_url: string | null;
  items: Array<{
    product_name: string;
    product_sku: string;
    quantity_shipped: number;
  }>;
}

export interface OrderShipmentHistoryCardProps {
  shipmentHistory: ShipmentHistoryItem[];
  order: SalesOrder;
  onSendTrackingEmail?: (shipment: ShipmentHistoryItem) => void;
}

/** Format a date string to French locale */
function formatDate(date: string | null): string {
  if (!date) return 'Non définie';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function OrderShipmentHistoryCard({
  shipmentHistory,
  order,
  onSendTrackingEmail,
}: OrderShipmentHistoryCardProps) {
  if (shipmentHistory.length === 0) return null;

  // Global shipping progress
  const totalOrdered =
    order.sales_order_items?.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0
    ) ?? 0;
  const totalShipped = shipmentHistory.reduce(
    (sum, h) =>
      sum + h.items.reduce((s, i) => s + (i.quantity_shipped ?? 0), 0),
    0
  );
  const percentShipped =
    totalOrdered > 0 ? Math.round((totalShipped / totalOrdered) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-3 w-3" />
          Historique ({shipmentHistory.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
        {totalOrdered > 0 && (
          <div className="mb-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-blue-900">
              <span>
                {shipmentHistory.length} expédition
                {shipmentHistory.length > 1 ? 's' : ''} · {totalShipped}/
                {totalOrdered} articles
              </span>
              <span>{percentShipped}%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded bg-blue-100">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(percentShipped, 100)}%` }}
              />
            </div>
          </div>
        )}
        {shipmentHistory.map((h, idx) => (
          <div
            key={`shipment-${idx}`}
            className="border rounded p-2 bg-gray-50 text-xs"
          >
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-blue-600" />
              <span className="font-semibold text-gray-800">
                Expédition #{idx + 1}
              </span>
              <span className="text-gray-400">—</span>
              <span className="text-gray-600">{formatDate(h.shipped_at)}</span>
              {h.carrier_name && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                  {h.carrier_name}
                </Badge>
              )}
              {h.packlink_status && (
                <Badge
                  className={`text-[10px] px-1 py-0 ml-1 ${
                    h.packlink_status === 'a_payer'
                      ? 'bg-red-100 text-red-800'
                      : h.packlink_status === 'paye'
                        ? 'bg-green-100 text-green-800'
                        : h.packlink_status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : h.packlink_status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                  }`}
                >
                  {h.packlink_status === 'a_payer'
                    ? 'Transport à payer'
                    : h.packlink_status === 'paye'
                      ? 'Transport payé'
                      : h.packlink_status === 'in_transit'
                        ? 'En transit'
                        : h.packlink_status === 'delivered'
                          ? 'Livré'
                          : 'Incident'}
                </Badge>
              )}
              {h.delivery_method && !h.packlink_status && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                  {h.delivery_method === 'manual'
                    ? 'Manuel'
                    : h.delivery_method === 'pickup'
                      ? 'Retrait'
                      : h.delivery_method === 'hand_delivery'
                        ? 'Main propre'
                        : h.delivery_method}
                </Badge>
              )}
            </div>
            {h.packlink_status === 'a_payer' && (
              <p className="text-[10px] ml-4 mb-1">
                <a
                  href={
                    h.packlink_shipment_id
                      ? `https://pro.packlink.fr/private/shipments/${h.packlink_shipment_id}/create/address`
                      : 'https://pro.packlink.fr/private/shipments'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink className="h-3 w-3" />
                  Finaliser sur Packlink PRO
                </a>
              </p>
            )}
            {h.tracking_number && (
              <p className="text-[10px] text-gray-500 ml-4 mb-1 flex items-center flex-wrap gap-x-1">
                <span>Suivi :</span>
                {h.tracking_url ? (
                  <a
                    href={h.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {h.tracking_number}
                  </a>
                ) : (
                  <span>{h.tracking_number}</span>
                )}
                {onSendTrackingEmail && (
                  <button
                    className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                    onClick={() => onSendTrackingEmail(h)}
                  >
                    <Mail className="h-3 w-3" />
                    Envoyer au client
                  </button>
                )}
              </p>
            )}
            {h.shipping_cost != null && h.shipping_cost > 0 && (
              <p className="text-[10px] text-gray-500 ml-4 mb-1">
                Coût transport : {formatCurrency(h.shipping_cost)}
              </p>
            )}
            {h.label_url && (
              <p className="text-[10px] ml-4 mb-1">
                <a
                  href={h.label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Télécharger étiquette
                </a>
              </p>
            )}
            <div className="ml-4 space-y-0.5">
              {h.items.map((item, itemIdx) => {
                const orderItem = order.sales_order_items?.find(
                  i => i.products?.sku === item.product_sku
                );
                const qtyOrdered = orderItem?.quantity ?? '?';
                return (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-600 truncate max-w-[120px]">
                      {item.product_name}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {item.quantity_shipped}/{qtyOrdered}
                    </Badge>
                  </div>
                );
              })}
            </div>
            {h.notes && (
              <p className="text-[10px] text-gray-500 ml-4 mt-1 italic">
                {h.notes}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
