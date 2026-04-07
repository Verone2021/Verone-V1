'use client';

import type { ReceptionHistory } from '@verone/types';

import { ProductThumbnail } from '@verone/products';
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
import { CheckCircle, AlertTriangle } from 'lucide-react';

import type {
  CancellationHistoryItem,
  PurchaseOrderWithSupplier,
} from './types';

interface ReceptionHistoryModalProps {
  selectedOrder: PurchaseOrderWithSupplier;
  receptionHistory: ReceptionHistory[];
  cancellationHistory: CancellationHistoryItem[];
  onClose: () => void;
}

export function ReceptionHistoryModal({
  selectedOrder,
  receptionHistory,
  cancellationHistory,
  onClose,
}: ReceptionHistoryModalProps) {
  return (
    <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Détails réception - {selectedOrder.po_number}</CardTitle>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              ✕
            </ButtonV2>
          </div>
          <CardDescription>
            Fournisseur: {selectedOrder.supplier_name ?? 'Non renseigné'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receptionHistory.length === 0 && cancellationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun détail de réception disponible
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECTION RÉCEPTIONS */}
              {receptionHistory.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Réceptions ({receptionHistory.length})
                  </h3>
                  {receptionHistory.map(
                    (reception: ReceptionHistory, index: number) => (
                      <Card
                        key={index}
                        className="border-l-4 border-verone-success"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                Réception #{index + 1}
                              </CardTitle>
                              <CardDescription>
                                {reception.received_at
                                  ? `Reçue le ${formatDate(reception.received_at)}`
                                  : 'Date non disponible'}
                              </CardDescription>
                            </div>
                            {reception.received_by_name && (
                              <Badge variant="outline">
                                Par: {reception.received_by_name}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {reception.notes && (
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                              <p className="text-sm font-medium text-gray-700">
                                Notes:
                              </p>
                              <p className="text-sm text-gray-600">
                                {reception.notes}
                              </p>
                            </div>
                          )}

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]" />
                                <TableHead>Produit</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">
                                  Quantité reçue
                                </TableHead>
                                <TableHead className="text-right">
                                  Stock avant
                                </TableHead>
                                <TableHead className="text-right">
                                  Stock après
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reception.items?.map(
                                (
                                  item: ReceptionHistory['items'][0],
                                  idx: number
                                ) => (
                                  <TableRow key={idx}>
                                    <TableCell className="w-[50px] p-1">
                                      <ProductThumbnail
                                        src={item.product_image_url}
                                        alt={item.product_name}
                                        size="xs"
                                      />
                                    </TableCell>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {item.product_sku}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                      +{item.quantity_received}
                                    </TableCell>
                                    <TableCell className="text-right text-gray-600">
                                      {item.stock_before}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {item.stock_after}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>

                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium text-gray-700">
                              Total reçu:{' '}
                              <span className="text-verone-success font-bold">
                                {reception.total_quantity} unités
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </>
              )}

              {/* SECTION ANNULATIONS */}
              {cancellationHistory.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mt-6">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Annulations ({cancellationHistory.length} produit
                    {cancellationHistory.length > 1 ? 's' : ''})
                  </h3>
                  <Card className="border-l-4 border-amber-500">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-700">
                        Reliquat annulé
                      </CardTitle>
                      <CardDescription>
                        {cancellationHistory[0]?.performed_at
                          ? `Annulé le ${formatDate(cancellationHistory[0].performed_at)}`
                          : 'Date non disponible'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {cancellationHistory[0]?.notes && (
                        <div className="mb-4 p-3 bg-amber-50 rounded border border-amber-200">
                          <p className="text-sm font-medium text-amber-800">
                            Raison:
                          </p>
                          <p className="text-sm text-amber-700">
                            {cancellationHistory[0].notes}
                          </p>
                        </div>
                      )}

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">
                              Quantité annulée
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancellationHistory.map(
                            (
                              cancellation: CancellationHistoryItem,
                              idx: number
                            ) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  {cancellation.product_name}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {cancellation.product_sku}
                                </TableCell>
                                <TableCell className="text-right font-medium text-amber-600">
                                  -{cancellation.quantity_cancelled}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700">
                          Total annulé:{' '}
                          <span className="text-amber-600 font-bold">
                            {cancellationHistory.reduce(
                              (sum: number, c: CancellationHistoryItem) =>
                                sum + c.quantity_cancelled,
                              0
                            )}{' '}
                            unités
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
