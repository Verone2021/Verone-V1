'use client';

import React from 'react';

import type { PurchaseOrder } from '@verone/orders';
import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import { TableCell, TableRow } from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { cn } from '@verone/utils';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { ChevronDown } from 'lucide-react';

import type { PurchaseOrderExtended } from './types';
import { statusLabels, statusColors } from './types';
import { PurchaseOrderActionMenu } from './components/PurchaseOrderActionMenu';

interface FournisseursTableRowProps {
  order: PurchaseOrder;
  isExpanded: boolean;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onValidate: () => void;
  onDevalidate: () => void;
  onReceive: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onCancelRemainder: () => void;
  onLinkTransaction: () => void;
}

export function FournisseursTableRow({
  order,
  isExpanded,
  onToggle,
  onView,
  onEdit,
  onValidate,
  onDevalidate,
  onReceive,
  onCancel,
  onDelete,
  onCancelRemainder,
  onLinkTransaction,
}: FournisseursTableRowProps) {
  const items = order.purchase_order_items ?? [];
  const hasSamples = items.some(item => item.sample_type);

  return (
    <React.Fragment>
      <TableRow>
        {/* Chevron expansion */}
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
          <span className="text-xs font-mono font-medium break-all leading-tight">
            {order.po_number}
          </span>
        </TableCell>
        <TableCell>
          <div className="text-sm font-medium leading-tight break-words">
            {order.organisations
              ? getOrganisationDisplayName(order.organisations)
              : 'Non défini'}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', statusColors[order.status])}>
              {statusLabels[order.status]}
            </Badge>
            {hasSamples && (
              <Badge variant="secondary" className="text-xs">
                Échantillon
              </Badge>
            )}
          </div>
        </TableCell>
        {/* Colonne Paiement */}
        <TableCell className="hidden xl:table-cell">
          {(order as PurchaseOrderExtended).payment_status_v2 === 'overpaid' ? (
            <Badge className="text-xs bg-red-100 text-red-800">Surpaye</Badge>
          ) : (order as PurchaseOrderExtended).payment_status_v2 === 'paid' ? (
            <Badge className="text-xs bg-green-100 text-green-800">Paye</Badge>
          ) : (order as PurchaseOrderExtended).payment_status_v2 ===
            'partially_paid' ? (
            <Badge className="text-xs bg-amber-100 text-amber-800">
              Partiel
            </Badge>
          ) : (
            <Badge className="text-xs bg-orange-100 text-orange-800">
              En attente
            </Badge>
          )}
        </TableCell>
        {/* Colonne Articles */}
        <TableCell className="hidden lg:table-cell text-center whitespace-nowrap">
          <span className="text-xs font-medium">{items.length}</span>
          <span className="text-muted-foreground text-[10px] ml-0.5">ref.</span>
        </TableCell>
        <TableCell className="hidden lg:table-cell whitespace-nowrap">
          <span className="text-xs">
            {order.order_date
              ? formatDate(order.order_date)
              : formatDate(order.created_at)}
          </span>
        </TableCell>
        <TableCell className="hidden 2xl:table-cell whitespace-nowrap">
          <span className="text-xs">
            {['received', 'partially_received'].includes(order.status) &&
            order.received_at ? (
              <span className="text-green-700">
                {formatDate(order.received_at)}
              </span>
            ) : order.expected_delivery_date ? (
              formatDate(order.expected_delivery_date)
            ) : (
              <span className="text-muted-foreground">Non définie</span>
            )}
          </span>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <span className="text-xs font-medium">
            {formatCurrency(order.total_ttc)}
          </span>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <PurchaseOrderActionMenu
            order={order as PurchaseOrderExtended}
            onView={onView}
            onEdit={onEdit}
            onValidate={onValidate}
            onDevalidate={onDevalidate}
            onReceive={onReceive}
            onCancel={onCancel}
            onDelete={onDelete}
            onCancelRemainder={onCancelRemainder}
            onLinkTransaction={onLinkTransaction}
          />
        </TableCell>
      </TableRow>

      {/* Ligne d'expansion - affiche les produits */}
      {isExpanded && items.length > 0 && (
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableCell colSpan={10} className="p-0">
            <div className="py-3 px-6 space-y-2">
              {items.map(item => (
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
                  {item.sample_type && (
                    <Badge variant="secondary" className="text-xs">
                      {item.sample_type === 'internal'
                        ? 'Éch. interne'
                        : 'Éch. client'}
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
