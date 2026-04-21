'use client';

import Image from 'next/image';

import { canEditItems } from '@verone/orders';
import type { SalesOrderStatus } from '@verone/orders/hooks';
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
import { Package, Plus, Save, Trash2 } from 'lucide-react';

import type { EnrichedOrderItem, OrderWithDetails } from '../types';

interface OrderItemsTableProps {
  order: OrderWithDetails;
  enrichedItems: EnrichedOrderItem[];
  editedQuantities: Record<string, number>;
  setEditedQuantities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  editedPrices: Record<string, number>;
  setEditedPrices: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  editedMargins: Record<string, number>;
  setEditedMargins: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  hasItemChanges: boolean;
  isSavingItems: boolean;
  onSaveItems: () => void;
  onDeleteItem: (itemId: string) => void;
  onOpenAddProduct: () => void;
}

export function OrderItemsTable({
  order,
  enrichedItems,
  editedQuantities,
  setEditedQuantities,
  editedPrices,
  setEditedPrices,
  editedMargins,
  setEditedMargins,
  hasItemChanges,
  isSavingItems,
  onSaveItems,
  onDeleteItem,
  onOpenAddProduct,
}: OrderItemsTableProps) {
  // R6 finance.md: items FIGÉS dès validated. Dévalider → modifier → revalider.
  const isEditable = canEditItems(order.status as SalesOrderStatus);

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
          {isEditable && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={onOpenAddProduct}
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          )}
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
                  <TableHead className="text-right">Prix vente HT</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  {isEditable && <TableHead className="text-center w-10" />}
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
                  const rawPct = isRevendeur
                    ? item.affiliate_margin > 0 && item.total_ht > 0
                      ? (item.affiliate_margin / item.total_ht) * 100
                      : 0
                    : item.retrocession_rate * 100;
                  const displayCommissionPct =
                    rawPct % 1 === 0 ? rawPct.toFixed(0) : rawPct.toFixed(2);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.product_image_url ? (
                            <Image
                              src={item.product_image_url}
                              alt={item.product_name}
                              width={40}
                              height={40}
                              className="rounded border border-gray-200 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
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
                            {item.stock_real !== undefined && (
                              <p className="text-[11px] mt-0.5">
                                <span className="text-blue-600 font-medium">
                                  {item.stock_real ?? 0}
                                </span>
                                <span className="text-gray-500"> réel</span>
                                <span className="text-gray-400"> / </span>
                                <span className="text-emerald-600 font-medium">
                                  {item.stock_forecasted ?? 0}
                                </span>
                                <span className="text-gray-500"> prévi</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      {/* Prix Verone HT (base_price — read-only) */}
                      <TableCell className="text-right">
                        {formatCurrency(
                          item.base_price_ht || item.unit_price_ht
                        )}
                      </TableCell>
                      {/* Commission/Marge % — editable (indépendant du prix) */}
                      <TableCell className="text-center">
                        {isEditable ? (
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            className="w-[72px] h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={
                              editedMargins[item.id] ??
                              parseFloat(displayCommissionPct)
                            }
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0 && val <= 100) {
                                setEditedMargins(prev => ({
                                  ...prev,
                                  [item.id]: val,
                                }));
                              }
                            }}
                          />
                        ) : (
                          <span
                            className={
                              isRevendeur ? 'text-orange-500' : 'text-teal-600'
                            }
                          >
                            {`${displayCommissionPct}%`}
                          </span>
                        )}
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
                      {/* Prix vente HT — editable (indépendant de la marge, comme CartSection) */}
                      <TableCell className="text-right font-medium">
                        {isEditable ? (
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            className="w-[110px] h-8 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={editedPrices[item.id] ?? item.unit_price_ht}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                setEditedPrices(prev => ({
                                  ...prev,
                                  [item.id]: Math.round(val * 100) / 100,
                                }));
                              }
                            }}
                          />
                        ) : (
                          formatCurrency(item.unit_price_ht)
                        )}
                      </TableCell>
                      {/* Quantité */}
                      <TableCell className="text-center">
                        {isEditable ? (
                          <Input
                            type="number"
                            min={1}
                            className="w-[72px] h-8 text-center mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      {/* Supprimer — seulement si éditable */}
                      {isEditable && (
                        <TableCell className="text-center w-10">
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer l'article"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      )}
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
