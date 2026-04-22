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
  SalesOrderProgress,
  ProductImage,
} from './expeditions-types';

interface OrderRowProps {
  order: SalesOrder;
  isExpanded: boolean;
  isPacklinkPending: boolean;
  /**
   * Source de vérité unifiée depuis v_sales_order_progress (BO-SHIP-PROG-001).
   * Peut être `undefined` le temps du chargement initial — fallback 0%.
   */
  progress?: SalesOrderProgress;
  onToggle: (id: string) => void;
  onShip: (order: SalesOrder) => void;
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
  reserved: number;
  ordered: number;
  hasPendingPayment: boolean;
  hasIncident: boolean;
}

function ProgressCell({
  percent,
  reserved,
  ordered,
  hasPendingPayment,
  hasIncident,
}: ProgressCellProps) {
  // Couleur selon l'état réel : incident rouge > pending paiement orange > OK vert
  const barColor = hasIncident
    ? 'bg-red-500'
    : hasPendingPayment
      ? 'bg-orange-400'
      : 'bg-green-500';
  return (
    <div className="flex flex-col gap-0.5 min-w-[140px]">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-12 text-right">
          {percent}%
        </span>
      </div>
      {ordered > 0 && (
        <span className="text-[11px] text-gray-500">
          {reserved}/{ordered} article{ordered > 1 ? 's' : ''}
          {hasPendingPayment && reserved > 0 && ' en attente paiement'}
        </span>
      )}
    </div>
  );
}

interface ActionCellProps {
  order: SalesOrder;
  isPacklinkPending: boolean;
  isFullyShipped: boolean;
  onShip: (order: SalesOrder) => void;
}

function ActionCell({
  order,
  isPacklinkPending,
  isFullyShipped,
  onShip,
}: ActionCellProps) {
  // L'ID du shipment Packlink spécifique n'est pas disponible dans la ligne
  // commande (les shipments sont chargés à part via /api/packlink/shipments/pending).
  // Fallback vers la liste Packlink PRO filtrée par référence commande.
  const packlinkHref = `https://pro.packlink.fr/private/shipments?search=${encodeURIComponent(order.order_number ?? '')}`;

  // Scénario multi-colis : une commande peut avoir un lot a_payer ET des articles
  // restant à expédier. On affiche alors les 2 actions (Payer + Nouvelle expédition).
  const showPayButton = isPacklinkPending;
  const showShipButton = !isFullyShipped;

  if (showPayButton && showShipButton) {
    return (
      <div className="flex gap-1 flex-wrap">
        <a
          href={packlinkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
          Payer
        </a>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            onShip(order);
          }}
        >
          <Truck className="h-4 w-4 mr-1" />
          Reste
        </ButtonV2>
      </div>
    );
  }
  if (showPayButton) {
    return (
      <a
        href={packlinkHref}
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
  totalReserved: number;
  totalOrdered: number;
  hasPendingPayment: boolean;
  hasIncident: boolean;
  isFullyShipped: boolean;
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
  totalReserved,
  totalOrdered,
  hasPendingPayment,
  hasIncident,
  isFullyShipped,
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
      <TableCell className="hidden lg:table-cell">
        {order.expected_delivery_date
          ? formatDate(order.expected_delivery_date)
          : 'Non définie'}
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <ProgressCell
          percent={progressPercent}
          reserved={totalReserved}
          ordered={totalOrdered}
          hasPendingPayment={hasPendingPayment}
          hasIncident={hasIncident}
        />
      </TableCell>
      <TableCell>
        <ActionCell
          order={order}
          isPacklinkPending={isPacklinkPending}
          isFullyShipped={isFullyShipped}
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
  progress,
  onToggle,
  onShip,
}: OrderRowProps) {
  // Progression source unifiée v_sales_order_progress : pas de calcul côté client,
  // pas de hardcode de statuts. Fallback 0% si la vue n'a pas (encore) renvoyé la ligne.
  const progressPercent = progress?.progress_percent ?? 0;
  const totalReserved = progress?.total_reserved ?? 0;
  const totalOrdered = progress?.total_ordered ?? 0;
  const hasPendingPayment = progress?.has_pending_payment ?? isPacklinkPending;
  const hasIncident = progress?.has_incident ?? false;
  const isFullyShipped = totalOrdered > 0 && totalReserved >= totalOrdered;
  const { isOverdue, isUrgent } = computeUrgency(order);
  return (
    <React.Fragment>
      <OrderMainRow
        order={order}
        isExpanded={isExpanded}
        isPacklinkPending={isPacklinkPending}
        progress={progress}
        onToggle={onToggle}
        onShip={onShip}
        progressPercent={progressPercent}
        totalReserved={totalReserved}
        totalOrdered={totalOrdered}
        hasPendingPayment={hasPendingPayment}
        hasIncident={hasIncident}
        isFullyShipped={isFullyShipped}
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
