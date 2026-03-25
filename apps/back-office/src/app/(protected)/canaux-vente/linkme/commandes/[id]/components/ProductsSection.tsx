'use client';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Package } from 'lucide-react';

import type { OrderWithDetails, EnrichedOrderItem } from './types';

interface ProductsSectionProps {
  items: OrderWithDetails['items'];
  enrichedItems: EnrichedOrderItem[];
}

export function ProductsSection({
  items,
  enrichedItems,
}: ProductsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-600" />
          <CardTitle className="text-base">Articles</CardTitle>
          <span className="text-xs text-gray-400">({items.length})</span>
        </div>
      </CardHeader>
      <CardContent>
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
                  <TableHead className="text-center">Qte</TableHead>
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
                      {/* Prix Verone HT */}
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
                      {/* Prix client HT */}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.unit_price_ht)}
                      </TableCell>
                      {/* Quantite */}
                      <TableCell className="text-center">
                        {item.quantity}
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
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">
                    {item.product?.name ?? 'Produit inconnu'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.product?.sku ?? '-'} x {item.quantity}
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
