'use client';

import React, { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import type { SalesOrder } from '../../hooks/use-sales-orders';
import type { SortColumn, SortDirection } from './sales-orders-constants';
import { SalesOrderTablePagination } from './SalesOrderTablePagination';
import { SalesOrderTableRow } from './SalesOrderTableRow';

export interface SalesOrderDataTableProps {
  paginatedOrders: SalesOrder[];
  filteredCount: number;
  loading: boolean;
  showChannelColumn: boolean;
  additionalColumns: Array<{
    key: string;
    header: string;
    cell: (order: SalesOrder) => React.ReactNode;
  }>;
  sortableColumns?: {
    date?: boolean;
    client?: boolean;
    amount?: boolean;
    orderNumber?: boolean;
  };
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  channelId?: string | null;
  allowEdit: boolean;
  allowValidate: boolean;
  allowShip: boolean;
  allowCancel: boolean;
  allowDelete: boolean;
  onView: (order: SalesOrder) => void;
  onEdit: (orderId: string) => void;
  onValidate: (orderId: string) => void;
  onDevalidate: (orderId: string) => void;
  onShip: (order: SalesOrder) => void;
  onCancel: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onLinkTransaction: (order: SalesOrder) => void;
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
}: SalesOrderDataTableProps): React.ReactNode {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (orderId: string): void => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const renderSortIcon = (column: SortColumn): React.ReactNode => {
    if (sortColumn !== column)
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
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
                    {sortableColumns?.orderNumber !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onSort('order_number')}
                      >
                        <span className="inline-flex items-center gap-1">
                          N Commande {renderSortIcon('order_number')}
                        </span>
                      </TableHead>
                    ) : (
                      <TableHead className="whitespace-nowrap">
                        N Commande
                      </TableHead>
                    )}
                    {sortableColumns?.client !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => onSort('client')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Client {renderSortIcon('client')}
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
                    {sortableColumns?.date !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onSort('date')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Date commande {renderSortIcon('date')}
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
                    {additionalColumns.map(col => (
                      <TableHead key={col.key}>{col.header}</TableHead>
                    ))}
                    {sortableColumns?.amount !== false ? (
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onSort('amount')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Montant TTC {renderSortIcon('amount')}
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
                  {paginatedOrders.map(order => (
                    <SalesOrderTableRow
                      key={order.id}
                      order={order}
                      isExpanded={expandedRows.has(order.id)}
                      showChannelColumn={showChannelColumn}
                      additionalColumns={additionalColumns}
                      channelId={channelId}
                      allowEdit={allowEdit}
                      allowValidate={allowValidate}
                      allowShip={allowShip}
                      allowCancel={allowCancel}
                      allowDelete={allowDelete}
                      onToggle={() => toggleRow(order.id)}
                      onView={() => onView(order)}
                      onEdit={() => onEdit(order.id)}
                      onValidate={() => onValidate(order.id)}
                      onDevalidate={() => onDevalidate(order.id)}
                      onShip={() => onShip(order)}
                      onCancel={() => onCancel(order.id)}
                      onDelete={() => onDelete(order.id)}
                      onLinkTransaction={() => onLinkTransaction(order)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {enablePagination && filteredCount > 0 && (
          <SalesOrderTablePagination
            filteredCount={filteredCount}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
