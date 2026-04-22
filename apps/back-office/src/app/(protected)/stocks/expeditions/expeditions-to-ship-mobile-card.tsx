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
import { ChevronDown, ChevronRight, ExternalLink, Truck } from 'lucide-react';

import type { SalesOrder, SalesOrderProgress } from './expeditions-types';

function computeUrgency(order: SalesOrder) {
  const deliveryDate = order.expected_delivery_date
    ? new Date(order.expected_delivery_date)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = deliveryDate !== null && deliveryDate < today;
  const daysUntil = deliveryDate
    ? Math.ceil(
        (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const isUrgent = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;
  return { isOverdue, isUrgent };
}

interface ProgressBarProps {
  percent: number;
  hasPendingPayment: boolean;
  hasIncident: boolean;
}

function ProgressBar({
  percent,
  hasPendingPayment,
  hasIncident,
}: ProgressBarProps) {
  const barColor = hasIncident
    ? 'bg-red-500'
    : hasPendingPayment
      ? 'bg-orange-400'
      : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 w-10 text-right">{percent}%</span>
    </div>
  );
}

export interface ToShipMobileCardProps {
  order: SalesOrder;
  isExpanded: boolean;
  isPacklinkPending: boolean;
  /** Source unifiée v_sales_order_progress (BO-SHIP-PROG-001). */
  progress?: SalesOrderProgress;
  onToggle: (id: string) => void;
  onShip: (order: SalesOrder) => void;
}

export function ToShipMobileCard({
  order,
  isExpanded,
  isPacklinkPending,
  progress,
  onToggle,
  onShip,
}: ToShipMobileCardProps) {
  const progressPercent = progress?.progress_percent ?? 0;
  const hasPendingPayment = progress?.has_pending_payment ?? isPacklinkPending;
  const hasIncident = progress?.has_incident ?? false;
  const { isOverdue, isUrgent } = computeUrgency(order);

  const statusLabel = isPacklinkPending
    ? 'Transport à payer'
    : order.status === 'validated'
      ? 'Validée'
      : 'Partielle';

  const statusClass = isPacklinkPending
    ? 'bg-orange-100 text-orange-800 border-orange-200'
    : order.status === 'validated'
      ? 'bg-gray-100 text-gray-900'
      : 'bg-verone-warning text-white';

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
          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                En retard
              </Badge>
            )}
            {isUrgent && !isOverdue && (
              <Badge className="text-xs bg-verone-warning">Urgent</Badge>
            )}
            <Badge className={statusClass}>{statusLabel}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-2 space-y-2">
        <p className="text-sm text-gray-700">
          {order.customer_name ?? 'Client inconnu'}
        </p>
        {order.expected_delivery_date && (
          <p className="text-xs text-gray-500">
            Livraison prévue : {formatDate(order.expected_delivery_date)}
          </p>
        )}
        <ProgressBar
          percent={progressPercent}
          hasPendingPayment={hasPendingPayment}
          hasIncident={hasIncident}
        />
      </CardContent>

      <CardFooter className="pt-0 pb-3">
        {isPacklinkPending ? (
          <a
            href={`https://pro.packlink.fr/private/shipments?search=${encodeURIComponent(order.order_number ?? '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-md bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200 transition-colors h-11 w-full justify-center"
          >
            <ExternalLink className="h-4 w-4" />
            Payer Packlink
          </a>
        ) : (
          <ButtonV2
            variant="outline"
            className="h-11 w-full"
            onClick={e => {
              e.stopPropagation();
              onShip(order);
            }}
          >
            <Truck className="h-5 w-5 mr-2" />
            Expédier
          </ButtonV2>
        )}
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
