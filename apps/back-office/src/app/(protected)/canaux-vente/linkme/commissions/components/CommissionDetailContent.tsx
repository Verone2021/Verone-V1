'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Package } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Commission {
  id: string;
  order_id: string;
  order_amount_ht: number;
  affiliate_commission: number;
  affiliate_commission_ttc: number | null;
  margin_rate_applied: number;
  order_number: string | null;
  status: string | null;
  affiliate?: {
    display_name: string;
  } | null;
  sales_order?: {
    order_number: string;
    total_ht: number | null;
    total_ttc: number | null;
  } | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tax_rate: number | null;
  retrocession_rate: number | null;
  retrocession_amount: number | null;
  retrocession_amount_ttc: number | null;
  product: {
    name: string;
    sku: string | null;
  } | null;
}

interface CommissionDetailContentProps {
  commission: Commission;
}

// ============================================
// COMPONENT
// ============================================

export function CommissionDetailContent({
  commission,
}: CommissionDetailContentProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('sales_order_items')
        .select(
          `
          id,
          quantity,
          unit_price_ht,
          total_ht,
          tax_rate,
          retrocession_rate,
          retrocession_amount,
          retrocession_amount_ttc,
          product:products(name, sku)
        `
        )
        .eq('sales_order_id', commission.order_id);

      if (error) {
        console.error(
          '[CommissionDetailContent] Error fetching items:',
          error.message
        );
        setItems([]);
      } else {
        setItems(
          (data ?? []).map(row => ({
            ...row,
            product: Array.isArray(row.product)
              ? (row.product[0] ?? null)
              : row.product,
          })) as OrderItem[]
        );
      }
      setLoading(false);
    };

    void fetchItems().catch(err => {
      console.error('[CommissionDetailContent] fetchItems failed:', err);
    });
  }, [commission.order_id]);

  const orderNumber =
    commission.sales_order?.order_number ??
    commission.order_number ??
    `#${commission.order_id.slice(0, 8)}`;

  const statusLabel =
    commission.status === 'paid'
      ? 'Payee'
      : commission.status === 'validated'
        ? 'Payable'
        : commission.status === 'requested'
          ? 'Demandee'
          : 'En attente';

  const statusColor =
    commission.status === 'paid'
      ? 'bg-green-100 text-green-700 border-green-200'
      : commission.status === 'validated'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : commission.status === 'requested'
          ? 'bg-purple-100 text-purple-700 border-purple-200'
          : 'bg-orange-100 text-orange-700 border-orange-200';

  const totalRetroHT = items.reduce(
    (sum, item) => sum + (item.retrocession_amount ?? 0),
    0
  );
  const totalRetroTTC = items.reduce(
    (sum, item) => sum + (item.retrocession_amount_ttc ?? 0),
    0
  );

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Commande</p>
          <p className="text-lg font-bold font-mono">{orderNumber}</p>
        </div>
        <Badge variant="outline" className={statusColor}>
          {statusLabel}
        </Badge>
      </div>

      {commission.affiliate && (
        <p className="text-sm text-muted-foreground">
          Affilie :{' '}
          <span className="font-medium text-foreground">
            {commission.affiliate.display_name}
          </span>
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Total HT</p>
            <p className="text-sm font-bold">
              {formatPrice(
                commission.sales_order?.total_ht ?? commission.order_amount_ht
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Commission HT</p>
            <p className="text-sm font-bold text-blue-600">
              {formatPrice(commission.affiliate_commission)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Commission TTC</p>
            <p className="text-sm font-bold text-orange-600">
              {formatPrice(commission.affiliate_commission_ttc ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <div>
        <p className="text-sm font-medium mb-2">
          Detail par produit ({items.length} ligne{items.length > 1 ? 's' : ''})
        </p>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune ligne trouvee
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Produit</TableHead>
                  <TableHead className="text-xs text-center">Qte</TableHead>
                  <TableHead className="text-xs text-right">PU HT</TableHead>
                  <TableHead className="text-xs text-right">Total HT</TableHead>
                  <TableHead className="text-xs text-center">Taux</TableHead>
                  <TableHead className="text-xs text-right">Retro HT</TableHead>
                  <TableHead className="text-xs text-right">
                    Retro TTC
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">
                      <div>
                        <p className="font-medium truncate max-w-[180px]">
                          {item.product?.name ?? 'Produit inconnu'}
                        </p>
                        {item.product?.sku && (
                          <p className="text-muted-foreground text-[10px] font-mono">
                            {item.product.sku}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {formatPrice(item.unit_price_ht)}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {formatPrice(item.total_ht)}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {item.retrocession_rate != null
                        ? `${(item.retrocession_rate * 100).toFixed(0)}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-blue-600">
                      {formatPrice(item.retrocession_amount ?? 0)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-orange-600">
                      {formatPrice(item.retrocession_amount_ttc ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell className="text-xs" colSpan={5}>
                    Total
                  </TableCell>
                  <TableCell className="text-xs text-right text-blue-600">
                    {formatPrice(totalRetroHT)}
                  </TableCell>
                  <TableCell className="text-xs text-right text-orange-600">
                    {formatPrice(totalRetroTTC)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Margin rate info */}
      <div className="text-xs text-muted-foreground border-t pt-3">
        Taux de marge applique :{' '}
        {(commission.margin_rate_applied * 100).toFixed(1)}%
      </div>
    </div>
  );
}
