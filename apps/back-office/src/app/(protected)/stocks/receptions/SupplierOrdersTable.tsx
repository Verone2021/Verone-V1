'use client';

import React from 'react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
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
import { formatDate } from '@verone/utils';
import { Package, Truck, ChevronDown, ChevronRight } from 'lucide-react';

import { OrderProductsExpandedRow } from './OrderProductsExpandedRow';
import type { PurchaseOrderWithSupplier } from './types';

interface SupplierOrdersTableProps {
  orders: PurchaseOrderWithSupplier[];
  loading: boolean;
  error: string | null;
  expandedRows: Set<string>;
  onToggleRow: (orderId: string) => void;
  onOpenReception: (order: PurchaseOrderWithSupplier) => void;
}

export function SupplierOrdersTable({
  orders,
  loading,
  error,
  expandedRows,
  onToggleRow,
  onOpenReception,
}: SupplierOrdersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes fournisseurs à recevoir</CardTitle>
        <CardDescription>
          {orders.length} commande(s) trouvée(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Erreur: {error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune commande à recevoir</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Date livraison</TableHead>
                  <TableHead className="hidden xl:table-cell">Progression</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const totalItems =
                    order.purchase_order_items?.reduce(
                      (
                        sum: number,
                        item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                      ) => sum + item.quantity,
                      0
                    ) ?? 0;
                  const receivedItems =
                    order.purchase_order_items?.reduce(
                      (
                        sum: number,
                        item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                      ) => sum + (item.quantity_received ?? 0),
                      0
                    ) ?? 0;
                  const progressPercent =
                    totalItems > 0
                      ? Math.round((receivedItems / totalItems) * 100)
                      : 0;

                  const deliveryDate = order.expected_delivery_date
                    ? new Date(order.expected_delivery_date)
                    : null;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isOverdue = deliveryDate && deliveryDate < today;
                  const daysUntil = deliveryDate
                    ? Math.ceil(
                        (deliveryDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;
                  const isUrgent =
                    daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;

                  const isExpanded = expandedRows.has(order.id);

                  return (
                    <React.Fragment key={order.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => onToggleRow(order.id)}
                      >
                        <TableCell className="w-8">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.po_number}
                          {isOverdue && (
                            <Badge
                              variant="destructive"
                              className="ml-2 text-xs"
                            >
                              En retard
                            </Badge>
                          )}
                          {isUrgent && !isOverdue && (
                            <Badge className="ml-2 text-xs bg-verone-warning">
                              Urgent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.supplier_name ?? 'Fournisseur inconnu'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              order.status === 'validated'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-500 text-white'
                            }
                          >
                            {order.status === 'validated'
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
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {progressPercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              onOpenReception(order);
                            }}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Recevoir
                          </ButtonV2>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <OrderProductsExpandedRow
                          orderId={order.id}
                          items={order.purchase_order_items ?? []}
                          colSpan={7}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
