'use client';

import {
  Badge,
  ButtonV2,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@verone/ui';
import { formatDate } from '@verone/utils';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';

import type { SalesOrder, SalesOrderItem } from './expeditions-types';

export interface HistoryMobileCardProps {
  order: SalesOrder;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onViewHistory: (order: SalesOrder) => void;
}

export function HistoryMobileCard({
  order,
  isExpanded,
  onToggle,
  onViewHistory,
}: HistoryMobileCardProps) {
  const totalItems =
    order.sales_order_items?.reduce(
      (sum: number, item: SalesOrderItem) => sum + item.quantity,
      0
    ) ?? 0;

  const statusLabel = order.status === 'shipped' ? 'Expédiée' : 'Livrée';
  const statusClass =
    order.status === 'shipped'
      ? 'bg-green-500 text-white'
      : 'bg-blue-500 text-white';

  return (
    <Card className="w-full">
      <CardHeader
        className="cursor-pointer pb-2"
        onClick={() => onToggle(order.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
            )}
            <span className="font-medium truncate">{order.order_number}</span>
          </div>
          <Badge className={statusClass}>{statusLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-2 space-y-1">
        <p className="text-sm text-gray-700">
          {order.customer_name ?? 'Client inconnu'}
        </p>
        {order.shipped_at && (
          <p className="text-xs text-gray-500">
            Expédiée le : {formatDate(order.shipped_at)}
          </p>
        )}
        {order.delivered_at && (
          <p className="text-xs text-gray-500">
            Livrée le : {formatDate(order.delivered_at)}
          </p>
        )}
        <p className="text-xs text-gray-500">{totalItems} unité(s)</p>
      </CardContent>

      <CardFooter className="pt-0 pb-3">
        <ButtonV2
          variant="outline"
          className="h-11 w-full"
          onClick={e => {
            e.stopPropagation();
            onViewHistory(order);
          }}
        >
          <Eye className="h-5 w-5 mr-2" />
          Voir détails
        </ButtonV2>
      </CardFooter>

      {isExpanded &&
        order.sales_order_items &&
        order.sales_order_items.length > 0 && (
          <div className="px-4 pb-4 border-t pt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Produits ({order.sales_order_items.length})
            </p>
            <div className="space-y-1">
              {order.sales_order_items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate mr-2">
                    {item.products?.name ?? 'Produit inconnu'}
                  </span>
                  <span className="text-gray-500 shrink-0">
                    {item.quantity_shipped ?? 0}/{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </Card>
  );
}
