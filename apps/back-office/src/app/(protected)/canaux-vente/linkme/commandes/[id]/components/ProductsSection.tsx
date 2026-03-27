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

// ---- ProductRow sub-component ----

interface ProductRowProps {
  item: EnrichedOrderItem;
}

function ProductRow({ item }: ProductRowProps) {
  const isRevendeur = !!item.created_by_affiliate;
  const commissionPerUnit =
    item.quantity > 0 ? (item.affiliate_margin ?? 0) / item.quantity : 0;
  // Use margin_rate directly (exact value from linkme_selection_items)
  // retrocession_rate in the view is often rounded — never use it for display
  const rawPct = isRevendeur
    ? item.affiliate_margin > 0 && item.total_ht > 0
      ? (item.affiliate_margin / item.total_ht) * 100
      : 0
    : item.margin_rate;
  const displayCommissionPct =
    rawPct % 1 === 0 ? rawPct.toFixed(0) : rawPct.toFixed(2).replace(/0+$/, '');

  return (
    <TableRow key={item.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-sm">{item.product_name}</p>
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
      <TableCell className="text-right">
        {formatCurrency(item.base_price_ht || item.unit_price_ht)}
      </TableCell>
      <TableCell className="text-center">
        <span
          className={isRevendeur ? 'text-orange-500' : 'text-teal-600'}
        >{`${displayCommissionPct}%`}</span>
      </TableCell>
      <TableCell className="text-right">
        <span className={isRevendeur ? 'text-orange-500' : 'text-teal-600'}>
          {formatCurrency(commissionPerUnit)}
        </span>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.unit_price_ht)}
      </TableCell>
      <TableCell className="text-center">{item.quantity}</TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.total_ht)}
      </TableCell>
    </TableRow>
  );
}

// ---- EnrichedTable sub-component ----

function EnrichedTable({
  enrichedItems,
}: {
  enrichedItems: EnrichedOrderItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Produit</TableHead>
            <TableHead className="text-right">Prix Verone HT</TableHead>
            <TableHead className="text-center">Commission %</TableHead>
            <TableHead className="text-right">Commission &euro;</TableHead>
            <TableHead className="text-right">Prix client HT</TableHead>
            <TableHead className="text-center">Qte</TableHead>
            <TableHead className="text-right">Total HT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrichedItems.map(item => (
            <ProductRow key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---- Fallback item list ----

function FallbackItemList({ items }: { items: OrderWithDetails['items'] }) {
  return (
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
          <p className="font-medium">{formatCurrency(item.total_ht)} HT</p>
        </div>
      ))}
    </div>
  );
}

// ---- ProductsSection (main export) ----

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
          <EnrichedTable enrichedItems={enrichedItems} />
        ) : (
          <FallbackItemList items={items} />
        )}
      </CardContent>
    </Card>
  );
}
