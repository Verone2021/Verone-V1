'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { cn, formatCurrency, formatDate } from '@verone/utils';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  ChevronDown,
  Truck,
} from 'lucide-react';

import type { SalesOrder, SalesOrderItem } from '../../hooks/use-sales-orders';
import { SalesOrderActionMenu } from '../SalesOrderActionMenu';
import {
  statusLabels,
  statusColors,
  isOrderEditable,
  getChannelRedirectUrl,
} from './sales-orders-constants';
import type { SortColumn, SortDirection } from './sales-orders-constants';

export interface SalesOrderDataTableProps {
  /** Orders to display (already filtered and paginated) */
  paginatedOrders: SalesOrder[];
  /** Total filtered count (for display and pagination) */
  filteredCount: number;
  /** Loading state */
  loading: boolean;

  /** Column visibility */
  showChannelColumn: boolean;
  additionalColumns: Array<{
    key: string;
    header: string;
    cell: (order: SalesOrder) => React.ReactNode;
  }>;

  /** Sortable columns config */
  sortableColumns?: {
    date?: boolean;
    client?: boolean;
    amount?: boolean;
    orderNumber?: boolean;
  };

  /** Sort state */
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;

  /** Action permissions */
  channelId?: string | null;
  allowEdit: boolean;
  allowValidate: boolean;
  allowShip: boolean;
  allowCancel: boolean;
  allowDelete: boolean;

  /** Action handlers */
  onView: (order: SalesOrder) => void;
  onEdit: (orderId: string) => void;
  onValidate: (orderId: string) => void;
  onDevalidate: (orderId: string) => void;
  onShip: (order: SalesOrder) => void;
  onCancel: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onLinkTransaction: (order: SalesOrder) => void;

  /** Pagination */
  enablePagination: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: 10 | 20;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: 10 | 20) => void;
}

export function SalesOrderDataTable({
  paginatedOrders,
  filteredCount,
  loading,
  showChannelColumn,
  additionalColumns,
  sortableColumns,
  sortColumn,
  sortDirection,
  onSort,
  channelId,
  allowEdit,
  allowValidate,
  allowShip,
  allowCancel,
  allowDelete,
  onView,
  onEdit,
  onValidate,
  onDevalidate,
  onShip,
  onCancel,
  onDelete,
  onLinkTransaction,
  enablePagination,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: SalesOrderDataTableProps) {
  // Etat pour les lignes expandees (chevron)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (orderId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes</CardTitle>
        <CardDescription>
          {filteredCount} commande(s) trouvee(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : filteredCount === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune commande trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <div className="px-6">
              <Table className="w-auto [&_th]:px-2.5 [&_td]:px-2.5">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    {/* N Commande - sortable si sortableColumns.orderNumber */}
                    {sortableColumns?.orderNumber !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onSort('order_number')}
                      >
                        <span className="inline-flex items-center gap-1">
                          N Commande
                          {renderSortIcon('order_number')}
                        </span>
                      </TableHead>
                    ) : (
                      <TableHead className="whitespace-nowrap">
                        N Commande
                      </TableHead>
                    )}
                    {/* Client - sortable si sortableColumns.client */}
                    {sortableColumns?.client !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => onSort('client')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Client
                          {renderSortIcon('client')}
                        </span>
                      </TableHead>
                    ) : (
                      <TableHead>Client</TableHead>
                    )}
                    <TableHead className="whitespace-nowrap">Statut</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Paiement
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Expedition
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center">
                      Art.
                    </TableHead>
                    {/* Date commande - sortable si sortableColumns.date */}
                    {sortableColumns?.date !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onSort('date')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Date commande
                          {renderSortIcon('date')}
                        </span>
                      </TableHead>
                    ) : (
                      <TableHead className="whitespace-nowrap">
                        Date commande
                      </TableHead>
                    )}
                    {showChannelColumn && (
                      <TableHead className="whitespace-nowrap">Canal</TableHead>
                    )}
                    {/* Colonnes additionnelles */}
                    {additionalColumns.map(col => (
                      <TableHead key={col.key}>{col.header}</TableHead>
                    ))}
                    {/* Montant - sortable si sortableColumns.amount */}
                    {sortableColumns?.amount !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onSort('amount')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Montant TTC
                          {renderSortIcon('amount')}
                        </span>
                      </TableHead>
                    ) : (
                      <TableHead className="whitespace-nowrap">
                        Montant TTC
                      </TableHead>
                    )}
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map(order => {
                    const customerDisplayName =
                      order.customer_type === 'organization' &&
                      order.organisations
                        ? order.organisations.trade_name &&
                          order.organisations.trade_name !==
                            order.organisations.legal_name
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
                    const hasSamples = items.some(
                      item => item.is_sample === true
                    );
                    const isExpanded = expandedRows.has(order.id);

                    return (
                      <React.Fragment key={order.id}>
                        <TableRow>
                          {/* Chevron expansion */}
                          <TableCell className="w-10">
                            {items.length > 0 && (
                              <button
                                onClick={() => toggleRow(order.id)}
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
                              {/* Devis: affiche seulement si pas de facture finalisee (non-draft) */}
                              {order.quote_number &&
                                (!order.invoice_number ||
                                  order.invoice_status === 'draft') && (
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
                                {order.customer_type === 'organization'
                                  ? 'Pro'
                                  : 'Particulier'}
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
                                <Badge className="text-xs bg-red-100 text-red-800">
                                  Surpaye
                                </Badge>
                              ) : order.payment_status_v2 === 'paid' ? (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  Paye
                                </Badge>
                              ) : order.payment_status_v2 ===
                                'partially_paid' ? (
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
                            ) : order.status === 'validated' &&
                              order.has_pending_packlink ? (
                              <Badge className="text-[10px] bg-red-100 text-red-800">
                                Transport a payer
                              </Badge>
                            ) : order.status === 'validated' ? (
                              <Badge className="text-[10px] bg-gray-100 text-gray-600">
                                A expedier
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <span className="text-xs font-medium">
                              {items.length}
                            </span>
                            <span className="text-muted-foreground text-[10px] ml-0.5">
                              ref.
                            </span>
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
                          {/* Colonnes additionnelles */}
                          {additionalColumns.map(col => (
                            <TableCell key={col.key}>
                              {col.cell(order)}
                            </TableCell>
                          ))}
                          <TableCell className="whitespace-nowrap">
                            <span className="text-xs font-medium">
                              {formatCurrency(
                                order.total_ttc || order.total_ht
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <SalesOrderActionMenu
                              order={order}
                              channelId={channelId}
                              channelRedirectUrl={getChannelRedirectUrl(order)}
                              channelName={
                                order.sales_channel?.name ?? 'le CMS du canal'
                              }
                              isEditable={isOrderEditable(order, channelId)}
                              allowEdit={allowEdit}
                              allowValidate={allowValidate}
                              allowShip={allowShip}
                              allowCancel={allowCancel}
                              allowDelete={allowDelete}
                              onView={() => onView(order)}
                              onEdit={() => onEdit(order.id)}
                              onValidate={() => onValidate(order.id)}
                              onDevalidate={() => onDevalidate(order.id)}
                              onShip={() => onShip(order)}
                              onCancel={() => onCancel(order.id)}
                              onDelete={() => onDelete(order.id)}
                              onLinkTransaction={() => onLinkTransaction(order)}
                            />
                          </TableCell>
                        </TableRow>

                        {/* Ligne d'expansion - affiche les produits */}
                        {isExpanded && items.length > 0 && (
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell
                              colSpan={
                                9 +
                                additionalColumns.length +
                                (showChannelColumn ? 1 : 0)
                              }
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
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
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
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {enablePagination && filteredCount > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <div className="flex gap-1">
                <ButtonUnified
                  variant={itemsPerPage === 10 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onItemsPerPageChange(10);
                    onPageChange(1);
                  }}
                >
                  10
                </ButtonUnified>
                <ButtonUnified
                  variant={itemsPerPage === 20 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onItemsPerPageChange(20);
                    onPageChange(1);
                  }}
                >
                  20
                </ButtonUnified>
              </div>
              <span className="text-sm text-gray-600">par page</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredCount)} sur{' '}
                {filteredCount}
              </span>
              <div className="flex gap-1">
                <ButtonUnified
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Precedent
                </ButtonUnified>
                <ButtonUnified
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </ButtonUnified>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
