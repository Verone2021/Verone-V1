'use client';

import type { ReceptionItem } from '@verone/types';
import { Badge, Card } from '@verone/ui';
import { formatDate } from '@verone/utils';
import { AlertTriangle, CheckCircle2, Package, XCircle } from 'lucide-react';

interface IReceptionHistoryEntry {
  received_at: string;
  total_quantity: number;
  items?: Array<{
    product_sku: string;
    product_name: string;
    quantity_received: number;
  }>;
}

interface ICancellationEntry {
  id: string;
  performed_at: string;
  notes: string | null;
  quantity_cancelled: number;
  product_name: string;
  product_sku: string;
}

interface IReceptionHistorySectionProps {
  history: IReceptionHistoryEntry[];
  cancellations: ICancellationEntry[];
  items: ReceptionItem[];
  purchaseOrderStatus: string;
}

export function ReceptionHistorySection({
  history,
  cancellations,
  items,
  purchaseOrderStatus,
}: IReceptionHistorySectionProps): React.ReactNode {
  if (history.length === 0 && cancellations.length === 0) return null;

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-verone-primary" />
        Historique des réceptions ({history.length + cancellations.length})
      </h4>
      <div className="space-y-3">
        {history.map((h, idx) => (
          <div
            key={`reception-${idx}`}
            className="border rounded-lg p-3 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-800">
                  Réception #{idx + 1}
                </span>
                <span className="text-gray-500">—</span>
                <span className="text-gray-600">
                  {formatDate(h.received_at)}
                </span>
              </div>
              <Badge className="bg-green-100 text-green-800 border border-green-300">
                {h.total_quantity} unité{h.total_quantity > 1 ? 's' : ''} reçue
                {h.total_quantity > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-1 ml-6">
              {h.items?.map((item, itemIdx) => {
                const orderItem = items.find(
                  i => i.product_sku === item.product_sku
                );
                const qtyOrdered = orderItem?.quantity_ordered ?? '?';
                const isPartial = orderItem
                  ? item.quantity_received < orderItem.quantity_ordered
                  : false;

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
                        {item.quantity_received}/{qtyOrdered} reçu
                        {item.quantity_received > 1 ? 's' : ''}
                      </span>
                      {isPartial ? (
                        <Badge
                          variant="outline"
                          className="text-xs text-amber-600 border-amber-300"
                        >
                          partiel
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-green-600 border-green-300"
                        >
                          complet
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {cancellations.map((c, idx) => {
          const motifMatch = c.notes?.match(/unités\.\s*(.+)$/);
          const motif = motifMatch?.[1]?.trim() ?? null;

          return (
            <div
              key={`cancellation-${idx}`}
              className="border rounded-lg p-3 bg-red-50 border-red-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-800">
                    Reliquat annulé
                  </span>
                  <span className="text-red-400">—</span>
                  <span className="text-red-600">
                    {formatDate(c.performed_at)}
                  </span>
                </div>
                <Badge className="bg-red-100 text-red-800 border border-red-300">
                  {c.quantity_cancelled} unité
                  {c.quantity_cancelled > 1 ? 's' : ''} annulée
                  {c.quantity_cancelled > 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-1 ml-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-400">├─</span>
                  <span className="font-medium text-red-700">
                    {c.product_name}
                  </span>
                  <span className="text-red-500 text-xs">
                    ({c.product_sku})
                  </span>
                </div>
                {motif && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-400">└─</span>
                    <span className="text-red-600 italic">Motif : {motif}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {purchaseOrderStatus === 'received' && cancellations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">
              Commande clôturée avec réception partielle
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
