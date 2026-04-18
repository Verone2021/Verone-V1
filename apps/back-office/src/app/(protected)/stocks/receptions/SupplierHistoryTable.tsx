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
import { Package, Eye, ChevronDown, ChevronRight } from 'lucide-react';

import { OrderProductsExpandedRow } from './OrderProductsExpandedRow';
import type { PurchaseOrderWithSupplier } from './types';

interface SupplierHistoryTableProps {
  orders: PurchaseOrderWithSupplier[];
  loading: boolean;
  error: string | null;
  expandedHistoryRows: Set<string>;
  onToggleRow: (orderId: string) => void;
  onViewHistory: (order: PurchaseOrderWithSupplier) => void;
}

export function SupplierHistoryTable({
  orders,
  loading,
  error,
  expandedHistoryRows,
  onToggleRow,
  onViewHistory,
}: SupplierHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique réceptions</CardTitle>
        <CardDescription>{orders.length} commande(s) reçue(s)</CardDescription>
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
            <p className="text-gray-500">Aucune réception dans l'historique</p>
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
                  <TableHead className="hidden lg:table-cell">
                    Date réception
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Quantité totale
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const totalOrdered =
                    order.purchase_order_items?.reduce(
                      (
                        sum: number,
                        item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                      ) => sum + item.quantity,
                      0
                    ) ?? 0;
                  const totalReceived =
                    order.purchase_order_items?.reduce(
                      (
                        sum: number,
                        item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                      ) => sum + (item.quantity_received ?? 0),
                      0
                    ) ?? 0;
                  const isComplete = totalReceived >= totalOrdered;
                  const isExpanded = expandedHistoryRows.has(order.id);

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
                        </TableCell>
                        <TableCell>
                          {order.supplier_name ?? 'Fournisseur inconnu'}
                        </TableCell>
                        <TableCell>
                          {isComplete ? (
                            <Badge className="bg-green-500 text-white">
                              Reçue complète
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white">
                              Reçue et clôturée ({totalReceived}/{totalOrdered})
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {order.received_at
                            ? formatDate(order.received_at)
                            : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {totalReceived}/{totalOrdered} unité(s)
                        </TableCell>
                        <TableCell>
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              void onViewHistory(order);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
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
