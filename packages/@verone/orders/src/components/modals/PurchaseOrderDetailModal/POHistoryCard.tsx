'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatDate as formatDateUtil } from '@verone/utils';
import { History, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

import type { PurchaseOrder } from '@verone/orders/hooks';

import type { ReceptionHistoryItem, CancellationItem } from './types';

interface POHistoryCardProps {
  order: PurchaseOrder;
  receptionHistory: ReceptionHistoryItem[];
  cancellations: CancellationItem[];
}

export function POHistoryCard({
  order,
  receptionHistory,
  cancellations,
}: POHistoryCardProps) {
  if (receptionHistory.length === 0 && cancellations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-3 w-3" />
          Historique ({receptionHistory.length + cancellations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
        {/* Réceptions */}
        {receptionHistory.map((h, idx) => (
          <div
            key={`reception-${idx}`}
            className="border rounded p-2 bg-gray-50 text-xs"
          >
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="font-semibold text-gray-800">
                Réception #{idx + 1}
              </span>
              <span className="text-gray-400">—</span>
              <span className="text-gray-600">
                {formatDateUtil(h.received_at)}
              </span>
            </div>
            <div className="ml-4 space-y-0.5">
              {h.items?.map((item, itemIdx) => {
                const orderItem = order.purchase_order_items?.find(
                  i => i.products?.sku === item.product_sku
                );
                const qtyOrdered = orderItem?.quantity ?? '?';
                return (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-600 truncate max-w-[120px]">
                      {item.product_name ?? item.product_sku}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {item.quantity_received}/{qtyOrdered}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Annulations */}
        {cancellations.map((c, idx) => {
          const motifMatch = c.notes?.match(/unités\.\s*(.+)$/);
          const motif = motifMatch?.[1]?.trim() ?? null;

          return (
            <div
              key={`cancel-${idx}`}
              className="border rounded p-2 bg-red-50 border-red-200 text-xs"
            >
              <div className="flex items-center gap-1 mb-1">
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="font-semibold text-red-800">
                  Reliquat annulé
                </span>
                <span className="text-red-400">—</span>
                <span className="text-red-600">
                  {formatDateUtil(c.performed_at)}
                </span>
              </div>
              <div className="ml-4">
                <div className="flex items-center justify-between">
                  <span className="text-red-700 truncate max-w-[120px]">
                    {c.product_name}
                  </span>
                  <Badge className="text-[10px] px-1 py-0 bg-red-100 text-red-800 border-red-300">
                    -{c.quantity_cancelled}
                  </Badge>
                </div>
                {motif && <p className="text-red-600 italic mt-0.5">{motif}</p>}
              </div>
            </div>
          );
        })}

        {/* Message clôture partielle */}
        {order.status === 'received' && cancellations.length > 0 && (
          <div className="flex items-center gap-1 p-2 bg-amber-50 rounded border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-amber-700">
              Clôturée avec réception partielle
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
