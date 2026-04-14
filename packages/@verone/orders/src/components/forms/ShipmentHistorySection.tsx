'use client';

import type { ShipmentItem } from '@verone/types';
import { Badge, Card } from '@verone/ui';
import { formatDate } from '@verone/utils';
import { CheckCircle2, Package } from 'lucide-react';

interface IShipmentHistoryEntry {
  shipped_at: string;
  total_quantity: number;
  tracking_number?: string | null;
  items?: Array<{
    product_sku: string;
    product_name: string;
    quantity_shipped: number;
  }>;
}

interface IShipmentHistorySectionProps {
  history: IShipmentHistoryEntry[];
  items: ShipmentItem[];
}

export function ShipmentHistorySection({
  history,
  items,
}: IShipmentHistorySectionProps): React.ReactNode {
  if (history.length === 0) return null;

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-verone-primary" />
        Historique des expéditions ({history.length})
      </h4>
      <div className="space-y-3">
        {history.map((h, idx) => (
          <div
            key={`shipment-${idx}`}
            className="border rounded-lg p-3 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-800">
                  Expédition #{idx + 1}
                </span>
                <span className="text-gray-500">—</span>
                <span className="text-gray-600">
                  {formatDate(h.shipped_at)}
                </span>
                {h.tracking_number && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-xs text-blue-600 font-mono">
                      {h.tracking_number}
                    </span>
                  </>
                )}
              </div>
              <Badge className="bg-green-100 text-green-800 border border-green-300">
                {h.total_quantity} unité{h.total_quantity > 1 ? 's' : ''}{' '}
                expédiée{h.total_quantity > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-1 ml-6">
              {h.items?.map((item, itemIdx) => {
                const orderItem = items.find(
                  i => i.product_sku === item.product_sku
                );
                const qtyOrdered = orderItem?.quantity_ordered ?? '?';

                return (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">├─</span>
                      <span className="font-medium text-gray-700">
                        {item.product_name ?? item.product_sku}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {item.quantity_shipped}/{qtyOrdered} expédié
                        {item.quantity_shipped > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
