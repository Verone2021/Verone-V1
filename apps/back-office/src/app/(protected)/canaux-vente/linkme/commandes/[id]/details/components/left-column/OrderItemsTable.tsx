'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Package, Save } from 'lucide-react';

import type { EnrichedOrderItem, OrderWithDetails } from '../types';

interface OrderItemsTableProps {
  order: OrderWithDetails;
  enrichedItems: EnrichedOrderItem[];
  editedQuantities: Record<string, number>;
  setEditedQuantities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  hasItemChanges: boolean;
  isSavingItems: boolean;
  onSaveItems: () => void;
}

export function OrderItemsTable({
  order,
  enrichedItems,
  editedQuantities,
  setEditedQuantities,
  hasItemChanges,
  isSavingItems,
  onSaveItems,
}: OrderItemsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            <CardTitle className="text-base">Articles</CardTitle>
            <span className="text-xs text-gray-400">
              ({order.items.length})
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasItemChanges && (
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              className="gap-2"
              disabled={isSavingItems}
              onClick={onSaveItems}
            >
              <Save className="h-4 w-4" />
              {isSavingItems
                ? 'Enregistrement...'
                : 'Sauvegarder les modifications'}
            </Button>
          </div>
        )}
        {enrichedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Produit</TableHead>
                  <TableHead className="text-right">Prix Verone HT</TableHead>
                  <TableHead className="text-center">Commission %</TableHead>
                  <TableHead className="text-right">
                    Commission &euro;
                  </TableHead>
                  <TableHead className="text-right">Prix client HT</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedItems.map(item => {
                  const isRevendeur = !!item.created_by_affiliate;
                  const commissionPerUnit =
                    item.quantity > 0
                      ? (item.affiliate_margin ?? 0) / item.quantity
                      : 0;
                  // For affiliate products, show affiliate_commission_rate; for catalogue, retrocession_rate
                  const displayCommissionPct = isRevendeur
                    ? item.affiliate_margin > 0 && item.total_ht > 0
                      ? Math.round(
                          (item.affiliate_margin / item.total_ht) * 100
                        )
                      : 0
                    : Math.round(item.retrocession_rate * 100);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              {item.product_name}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-500 font-mono">
                                {item.product_sku}
                              </p>
                              <Badge
                                variant="outline"
                                className={
                                  isRevendeur
                                    ? 'text-[10px] border-violet-500 text-violet-700 bg-violet-50'
                                    : 'text-[10px] border-blue-500 text-blue-700 bg-blue-50'
                                }
                              >
                                {isRevendeur ? 'REVENDEUR' : 'CATALOGUE'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {/* Prix Verone HT (base_price from selection) */}
                      <TableCell className="text-right">
                        {formatCurrency(
                          item.base_price_ht || item.unit_price_ht
                        )}
                      </TableCell>
                      {/* Commission % */}
                      <TableCell className="text-center">
                        <span
                          className={
                            isRevendeur ? 'text-orange-500' : 'text-teal-600'
                          }
                        >
                          {`${displayCommissionPct}%`}
                        </span>
                      </TableCell>
                      {/* Commission EUR (per unit) */}
                      <TableCell className="text-right">
                        <span
                          className={
                            isRevendeur ? 'text-orange-500' : 'text-teal-600'
                          }
                        >
                          {formatCurrency(commissionPerUnit)}
                        </span>
                      </TableCell>
                      {/* Prix client HT (includes commission) */}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.unit_price_ht)}
                      </TableCell>
                      {/* Quantité */}
                      <TableCell className="text-center">
                        {order.status === 'draft' ||
                        order.status === 'validated' ? (
                          <Input
                            type="number"
                            min={1}
                            className="w-16 h-8 text-center mx-auto"
                            value={editedQuantities[item.id] ?? item.quantity}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val > 0) {
                                setEditedQuantities(prev => ({
                                  ...prev,
                                  [item.id]: val,
                                }));
                              }
                            }}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      {/* Total HT */}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total_ht)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex-1 space-y-2">
            {order.items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">
                    {item.product?.name ?? 'Produit inconnu'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.product?.sku ?? '-'} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(item.total_ht)} HT
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
