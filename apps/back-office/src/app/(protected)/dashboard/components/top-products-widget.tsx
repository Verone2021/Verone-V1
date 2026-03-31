/**
 * TopProductsWidget Component
 * Displays top 5 products by revenue with period filter and thumbnails
 * Pattern: Shopify/WooCommerce leaderboard with Odoo margin badges
 */

'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { TrendingUp, Package } from 'lucide-react';
import type { DashboardMetrics } from '../actions/get-dashboard-metrics';

type Period = '7' | '30' | '90' | '365';

const PERIOD_LABELS: Record<Period, string> = {
  '7': '7 jours',
  '30': '30 jours',
  '90': '90 jours',
  '365': '1 an',
};

interface TopProductsWidgetProps {
  products: DashboardMetrics['sales']['topProducts'];
}

export function TopProductsWidget({ products }: TopProductsWidgetProps) {
  const [period, setPeriod] = useState<Period>('30');

  const filteredProducts = useMemo(() => {
    const days = parseInt(period);
    const cutoff = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();
    return products.filter(p => p.orderDate >= cutoff).slice(0, 5);
  }, [products, period]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Top Produits</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={v => setPeriod(v as Period)}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/produits/catalogue">Voir tout →</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Aucune vente sur les {PERIOD_LABELS[period]}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/produits/catalogue/${product.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-xs font-bold text-neutral-400 w-4 shrink-0">
                  {index + 1}
                </span>
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-neutral-900 truncate">
                    {product.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {product.quantity} vendus · {product.orders} cmd
                    {product.orders > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(product.revenueHt)}
                  </span>
                  {product.marginPct !== null && (
                    <Badge
                      variant="secondary"
                      className={
                        product.marginPct >= 40
                          ? 'bg-emerald-100 text-emerald-700'
                          : product.marginPct >= 25
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }
                    >
                      {product.marginPct}%
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
