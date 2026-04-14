'use client';

import React from 'react';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products';
import { Badge, TableCell, TableRow } from '@verone/ui';
import { cn, formatCurrency, formatDate } from '@verone/utils';
import { ChevronDown, FileText, Truck } from 'lucide-react';

import type { SalesOrder, SalesOrderItem } from '../../hooks/use-sales-orders';
import { SalesOrderActionMenu } from '../SalesOrderActionMenu';
import {
  statusColors,
  statusLabels,
  isOrderEditable,
  getChannelRedirectUrl,
} from './sales-orders-constants';

interface ISalesOrderTableRowProps {
  order: SalesOrder;
  isExpanded: boolean;
  showChannelColumn: boolean;
  additionalColumns: Array<{
    key: string;
    header: string;
    cell: (order: SalesOrder) => React.ReactNode;
  }>;
  channelId?: string | null;
  allowEdit: boolean;
  allowValidate: boolean;
  allowShip: boolean;
  allowCancel: boolean;
  allowDelete: boolean;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onValidate: () => void;
  onDevalidate: () => void;
  onShip: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onLinkTransaction: () => void;
}

export function SalesOrderTableRow({
  order,
  isExpanded,
  showChannelColumn,
  additionalColumns,
  channelId,
  allowEdit,
  allowValidate,
  allowShip,
  allowCancel,
  allowDelete,
  onToggle,
  onView,
  onEdit,
  onValidate,
  onDevalidate,
  onShip,
  onCancel,
  onDelete,
  onLinkTransaction,
}: ISalesOrderTableRowProps): React.ReactNode {
  const customerDisplayName =
    order.customer_type === 'organization' && order.organisations
      ? order.organisations.trade_name &&
        order.organisations.trade_name !== order.organisations.legal_name
        ? `${order.organisations.trade_name} (${order.organisations.legal_name})`
        : (order.organisations.legal_name ??
          order.organisations.trade_name ??
          '')
      : order.individual_customers
        ? [
            order.individual_customers.first_name,
            order.individual_customers.last_name,
          ]
            .filter(Boolean)
            .join(' ')
        : '';

  const items = order.sales_order_items ?? [];
  const hasSamples = items.some(item => item.is_sample === true);

  return (
    <React.Fragment>
      <TableRow>
        <TableCell className="w-10">
          {items.length > 0 && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-500 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
          )}
        </TableCell>
        <TableCell className="w-[80px]">
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-medium break-all leading-tight">
              {order.order_number}
            </span>
            {order.invoice_number && (
              <Link
                href={
                  order.invoice_qonto_id
                    ? `/factures/${order.invoice_qonto_id}?type=invoice`
                    : '#'
                }
                target="_blank"
                className="flex items-center gap-1 text-[10px] font-mono text-blue-600 hover:text-blue-800 hover:underline"
                title={`Voir facture ${order.invoice_number}`}
              >
                <FileText className="h-3 w-3 shrink-0" />
                {order.invoice_number}
              </Link>
            )}
            {order.quote_number &&
              (!order.invoice_number || order.invoice_status === 'draft') && (
                <Link
                  href={
                    order.quote_qonto_id
                      ? `/factures/devis/${order.quote_qonto_id}`
                      : '#'
                  }
                  target="_blank"
                  className="flex items-center gap-1 text-[10px] font-mono text-orange-600 hover:text-orange-800 hover:underline"
                  title={`Voir devis ${order.quote_number}`}
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  {order.quote_number}
                </Link>
              )}
            {order.has_pending_packlink && (
              <a
                href="https://pro.packlink.fr/private/shipments"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-mono text-red-600 hover:text-red-800 hover:underline"
                title="Finaliser expedition sur Packlink PRO"
              >
                <Truck className="h-3 w-3 shrink-0" />
                Packlink a payer
              </a>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div>
            <div className="text-sm font-medium leading-tight break-words">
              {customerDisplayName || 'Non defini'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {order.customer_type === 'organization' ? 'Pro' : 'Particulier'}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                'text-xs',
                order.status === 'draft' &&
                  order.pending_admin_validation === true
                  ? statusColors['pending_approval']
                  : statusColors[order.status]
              )}
            >
              {order.status === 'draft' &&
              order.pending_admin_validation === true
                ? statusLabels['pending_approval']
                : statusLabels[order.status]}
            </Badge>
            {hasSamples && (
              <Badge variant="secondary" className="text-xs">
                Echantillon
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {order.payment_status_v2 === 'overpaid' ? (
              <Badge className="text-xs bg-red-100 text-red-800">Surpaye</Badge>
            ) : order.payment_status_v2 === 'paid' ? (
              <Badge className="text-xs bg-green-100 text-green-800">
                Paye
              </Badge>
            ) : order.payment_status_v2 === 'partially_paid' ? (
              <Badge className="text-xs bg-amber-100 text-amber-800">
                Partiel
              </Badge>
            ) : (
              <Badge className="text-xs bg-orange-100 text-orange-800">
                En attente
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {order.status === 'shipped' ? (
            <Badge className="text-[10px] bg-green-100 text-green-800">
              Expediee
            </Badge>
          ) : order.status === 'partially_shipped' ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-800">
              Partielle
            </Badge>
          ) : (order.status as string) === 'delivered' ? (
            <Badge className="text-[10px] bg-blue-100 text-blue-800">
              Livree
            </Badge>
          ) : order.status === 'validated' && order.has_pending_packlink ? (
            <Badge className="text-[10px] bg-red-100 text-red-800">
              Transport a payer
            </Badge>
          ) : order.status === 'validated' ? (
            <Badge className="text-[10px] bg-gray-100 text-gray-600">
              A expedier
            </Badge>
          ) : (
            <span className="text-muted-foreground text-[10px]">—</span>
          )}
        </TableCell>
        <TableCell className="text-center whitespace-nowrap">
          <span className="text-xs font-medium">{items.length}</span>
          <span className="text-muted-foreground text-[10px] ml-0.5">ref.</span>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <span className="text-xs">
            {order.order_date
              ? formatDate(order.order_date)
              : formatDate(order.created_at)}
          </span>
        </TableCell>
        {showChannelColumn && (
          <TableCell className="whitespace-nowrap">
            {order.sales_channel?.name ? (
              <Badge
                variant="outline"
                className="text-[10px] font-medium px-1.5 py-0"
              >
                {order.sales_channel.name}
              </Badge>
            ) : (
              <span className="text-gray-400 text-xs">-</span>
            )}
          </TableCell>
        )}
        {additionalColumns.map(col => (
          <TableCell key={col.key}>{col.cell(order)}</TableCell>
        ))}
        <TableCell className="whitespace-nowrap">
          <span className="text-xs font-medium">
            {formatCurrency(order.total_ttc || order.total_ht)}
          </span>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <SalesOrderActionMenu
            order={order}
            channelId={channelId}
            channelRedirectUrl={getChannelRedirectUrl(order)}
            channelName={order.sales_channel?.name ?? 'le CMS du canal'}
            isEditable={isOrderEditable(order, channelId)}
            allowEdit={allowEdit}
            allowValidate={allowValidate}
            allowShip={allowShip}
            allowCancel={allowCancel}
            allowDelete={allowDelete}
            onView={onView}
            onEdit={onEdit}
            onValidate={onValidate}
            onDevalidate={onDevalidate}
            onShip={onShip}
            onCancel={onCancel}
            onDelete={onDelete}
            onLinkTransaction={onLinkTransaction}
          />
        </TableCell>
      </TableRow>

      {isExpanded && items.length > 0 && (
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableCell
            colSpan={9 + additionalColumns.length + (showChannelColumn ? 1 : 0)}
            className="p-0"
          >
            <div className="py-3 px-6 space-y-2">
              {items.map((item: SalesOrderItem) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 text-sm py-1"
                >
                  <ProductThumbnail
                    src={item.products?.primary_image_url}
                    alt={item.products?.name ?? 'Produit'}
                    size="xs"
                  />
                  <span className="flex-1 font-medium">
                    {item.products?.name ?? 'Produit inconnu'}
                  </span>
                  <span className="text-muted-foreground">
                    x{item.quantity}
                  </span>
                  <span className="font-medium w-24 text-right">
                    {formatCurrency(item.total_ht ?? 0)}
                  </span>
                  {item.is_sample && (
                    <Badge variant="secondary" className="text-xs">
                      Echantillon
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}
