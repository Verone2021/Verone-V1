'use client';

import React from 'react';

import { SalesOrderShipmentModal } from '@verone/orders';
import { ProductThumbnail } from '@verone/products';
import { Badge, ButtonV2 } from '@verone/ui';
import { TableCell, TableRow } from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { Truck, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

import type {
  SalesOrder,
  SalesOrderItem,
  ProductImage,
} from './expeditions-types';

interface OrderRowProps {
  order: SalesOrder;
  isExpanded: boolean;
  isPacklinkPending: boolean;
  onToggle: (id: string) => void;
  onShip: (order: SalesOrder) => void;
}

function computeProgress(
  order: SalesOrder,
  isPacklinkPending: boolean
): number {
  const totalItems =
    order.sales_order_items?.reduce(
      (sum: number, item: SalesOrderItem) => sum + item.quantity,
      0
    ) ?? 0;
  const shippedItems =
    order.sales_order_items?.reduce(
      (sum: number, item: SalesOrderItem) => sum + (item.quantity_shipped ?? 0),
      0
    ) ?? 0;
  if (isPacklinkPending) return 100;
  return totalItems > 0 ? Math.round((shippedItems / totalItems) * 100) : 0;
}

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

function OrderProductItem({ item }: { item: SalesOrderItem }) {
  const primaryImg =
    item.products?.product_images?.find((img: ProductImage) => img.is_primary)
      ?.public_url ?? item.products?.product_images?.[0]?.public_url;
  return (
    <div className="flex items-center gap-4 p-2 bg-white rounded-lg border">
      <ProductThumbnail
        src={primaryImg}
        alt={item.products?.name ?? 'Produit'}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {item.products?.name ?? 'Produit inconnu'}
        </p>
        <p className="text-xs text-gray-500 font-mono">
          SKU: {item.products?.sku ?? 'N/A'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {item.quantity_shipped ?? 0} / {item.quantity} expédié(s)
        </p>
        <p className="text-xs text-gray-500">
          Stock: {item.products?.stock_real ?? '-'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {formatCurrency(item.unit_price_ht * item.quantity)}
        </p>
        <p className="text-xs text-gray-500">
          {formatCurrency(item.unit_price_ht)} HT/u
        </p>
      </div>
    </div>
  );
}

function OrderItemsList({ order }: { order: SalesOrder }) {
  return (
    <div className="p-4">
      <h4 className="font-medium text-sm mb-3 text-gray-700">
        Produits de la commande ({order.sales_order_items?.length ?? 0})
      </h4>
      <div className="space-y-2">
        {order.sales_order_items?.map((item: SalesOrderItem) => (
          <OrderProductItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

interface ProgressCellProps {
  percent: number;
  isPacklinkPending: boolean;
}

function ProgressCell({ percent, isPacklinkPending }: ProgressCellProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isPacklinkPending ? 'bg-orange-400' : 'bg-green-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 w-12 text-right">{percent}%</span>
    </div>
  );
}

interface ActionCellProps {
  order: SalesOrder;
  isPacklinkPending: boolean;
  onShip: (order: SalesOrder) => void;
}

function ActionCell({ order, isPacklinkPending, onShip }: ActionCellProps) {
  if (isPacklinkPending) {
    return (
      <a
        href="https://pro.packlink.fr/private/shipments"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200 transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <ExternalLink className="h-3 w-3" />
        Payer Packlink
      </a>
    );
  }
  return (
    <ButtonV2
      variant="outline"
      size="sm"
      onClick={e => {
        e.stopPropagation();
        onShip(order);
      }}
    >
      <Truck className="h-4 w-4 mr-2" />
      Expédier
    </ButtonV2>
  );
}

interface OrderMainRowProps extends OrderRowProps {
  progressPercent: number;
  isOverdue: boolean;
  isUrgent: boolean;
}

function OrderMainRow({
  order,
  isExpanded,
  isPacklinkPending,
  onToggle,
  onShip,
  progressPercent,
  isOverdue,
  isUrgent,
}: OrderMainRowProps) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onToggle(order.id)}
    >
      <TableCell className="w-8">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </TableCell>
      <TableCell className="font-medium">
        {order.order_number}
        {isOverdue && (
          <Badge variant="destructive" className="ml-2 text-xs">
            En retard
          </Badge>
        )}
        {isUrgent && !isOverdue && (
          <Badge className="ml-2 text-xs bg-verone-warning">Urgent</Badge>
        )}
      </TableCell>
      <TableCell>{order.customer_name ?? 'Client inconnu'}</TableCell>
      <TableCell>
        <Badge
          className={
            isPacklinkPending
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : order.status === 'validated'
                ? 'bg-gray-100 text-gray-900'
                : 'bg-verone-warning text-white'
          }
        >
          {isPacklinkPending
            ? 'Transport à payer'
            : order.status === 'validated'
              ? 'Validée'
              : 'Partielle'}
        </Badge>
      </TableCell>
      <TableCell>
        {order.expected_delivery_date
          ? formatDate(order.expected_delivery_date)
          : 'Non définie'}
      </TableCell>
      <TableCell>
        <ProgressCell
          percent={progressPercent}
          isPacklinkPending={isPacklinkPending}
        />
      </TableCell>
      <TableCell>
        <ActionCell
          order={order}
          isPacklinkPending={isPacklinkPending}
          onShip={onShip}
        />
      </TableCell>
    </TableRow>
  );
}

export function OrderRow({
  order,
  isExpanded,
  isPacklinkPending,
  onToggle,
  onShip,
}: OrderRowProps) {
  const progressPercent = computeProgress(order, isPacklinkPending);
  const { isOverdue, isUrgent } = computeUrgency(order);
  return (
    <React.Fragment>
      <OrderMainRow
        order={order}
        isExpanded={isExpanded}
        isPacklinkPending={isPacklinkPending}
        onToggle={onToggle}
        onShip={onShip}
        progressPercent={progressPercent}
        isOverdue={isOverdue}
        isUrgent={isUrgent}
      />
      {isExpanded && (
        <TableRow key={`${order.id}-details`}>
          <TableCell colSpan={7} className="bg-gray-50 p-0">
            <OrderItemsList order={order} />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

interface ShipmentModalWrapperProps {
  orderToShip: SalesOrder | null;
  showShipmentModal: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShipmentModalWrapper({
  orderToShip,
  showShipmentModal,
  onClose,
  onSuccess,
}: ShipmentModalWrapperProps) {
  if (!orderToShip) return null;
  return (
    <SalesOrderShipmentModal
      order={orderToShip}
      open={showShipmentModal}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
