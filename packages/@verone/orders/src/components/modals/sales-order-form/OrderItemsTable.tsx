'use client';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { cn, formatCurrency } from '@verone/utils';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';

import { QuantityInput } from './QuantityInput';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  tax_rate: number;
  discount_percentage: number;
  eco_tax: number;
  expected_delivery_date?: string;
  notes?: string;
  is_sample?: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
    primary_image_url?: string;
    stock_quantity?: number;
    eco_tax_default?: number;
  };
  availableStock?: number;
  pricing_source?:
    | 'customer_specific'
    | 'customer_group'
    | 'channel'
    | 'base_catalog';
  original_price_ht?: number;
  auto_calculated?: boolean;
}

interface OrderItemsTableProps {
  items: OrderItem[];
  loading: boolean;
  isPriceEditable: boolean;
  onUpdateItem: (
    itemId: string,
    field: keyof OrderItem,
    value: OrderItem[keyof OrderItem]
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onAddProducts: () => void;
}

export function OrderItemsTable({
  items,
  loading,
  isPriceEditable,
  onUpdateItem,
  onRemoveItem,
  onAddProducts,
}: OrderItemsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Articles</CardTitle>
        <ButtonV2
          type="button"
          variant="outline"
          onClick={onAddProducts}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter des produits
        </ButtonV2>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun produit ajouté</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="w-36">Quantité</TableHead>
                  <TableHead className="w-36">Prix unitaire HT</TableHead>
                  <TableHead className="w-28">Remise (%)</TableHead>
                  <TableHead className="w-28">Éco-taxe (€)</TableHead>
                  <TableHead className="w-32">Total HT</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const itemSubtotal =
                    item.quantity *
                    item.unit_price_ht *
                    (1 - (item.discount_percentage ?? 0) / 100);
                  const itemTotal =
                    itemSubtotal + (item.eco_tax ?? 0) * item.quantity;

                  return (
                    <TableRow key={item.id}>
                      {/* Produit avec image */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.product?.primary_image_url && (
                            <Image
                              src={item.product.primary_image_url}
                              alt={item.product.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <span className="font-medium text-sm truncate max-w-[180px]">
                            {item.product?.name}
                          </span>
                        </div>
                      </TableCell>
                      {/* Quantité */}
                      <TableCell>
                        <QuantityInput
                          value={item.quantity}
                          onChange={val => {
                            onUpdateItem(item.id, 'quantity', val);
                          }}
                          disabled={loading}
                        />
                      </TableCell>
                      {/* Prix unitaire HT */}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price_ht}
                          onChange={e => {
                            onUpdateItem(
                              item.id,
                              'unit_price_ht',
                              parseFloat(e.target.value) || 0
                            );
                          }}
                          className={cn(
                            'w-full h-8 text-sm',
                            !isPriceEditable && 'bg-muted cursor-not-allowed'
                          )}
                          disabled={loading || !isPriceEditable}
                          title={
                            !isPriceEditable
                              ? 'Prix non modifiable pour ce canal'
                              : undefined
                          }
                        />
                      </TableCell>
                      {/* Remise (%) */}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discount_percentage ?? 0}
                          onChange={e => {
                            onUpdateItem(
                              item.id,
                              'discount_percentage',
                              parseFloat(e.target.value) || 0
                            );
                          }}
                          className="w-full h-8 text-sm"
                          disabled={loading}
                        />
                      </TableCell>
                      {/* Éco-taxe (€) */}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(item.eco_tax ?? 0).toFixed(2)}
                          onChange={e => {
                            onUpdateItem(
                              item.id,
                              'eco_tax',
                              parseFloat(e.target.value) || 0
                            );
                          }}
                          className="w-full h-8 text-sm"
                          disabled={loading}
                        />
                      </TableCell>
                      {/* Total HT */}
                      <TableCell className="font-medium text-sm whitespace-nowrap">
                        {formatCurrency(itemTotal)}
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <ButtonV2
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          disabled={loading}
                          title="Supprimer"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ButtonV2>
                      </TableCell>
                    </TableRow>
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

export type { OrderItem };
