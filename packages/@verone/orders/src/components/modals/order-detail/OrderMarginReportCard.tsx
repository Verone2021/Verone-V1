'use client';

/**
 * OrderMarginReportCard — Récap gain/perte d'une commande client.
 *
 * [BO-ORD-003 — Récap gain/perte commande]
 * Affiche pour chaque item de la commande client :
 * - Prix de vente HT (sales_order_items.unit_price_ht × qty × remise)
 * - Prix de revient HT = PMP (products.cost_price) × qty + transport achat estimé
 *   + quote-part frais de livraison vente
 * - Marge € et %
 *
 * 5 KPIs footer :
 * - CA total HT
 * - Coût produits total (PMP)
 * - Coût livraison total (achat + vente)
 * - Bénéfice net
 * - Marge moyenne %
 *
 * Lecture seule. Aucune mutation. Aucune migration DB.
 * Les données proviennent :
 * - `sales_order_items.unit_price_ht / quantity / discount_percentage`
 * - `products.cost_price` (PMP auto via trigger trg_update_pmp_on_po_received)
 * - `products.shipping_cost_estimate` (transport achat moyen)
 * - `sales_orders.shipping_cost_ht + handling + insurance` (transport vente)
 */

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
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
import { AlertTriangle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderMarginReportCardProps {
  orderId: string;
}

interface OrderItemRaw {
  id: string;
  quantity: number | null;
  unit_price_ht: number | null;
  discount_percentage: number | null;
  product_id: string | null;
  products: {
    id: string;
    name: string | null;
    sku: string | null;
    cost_price: number | null;
    shipping_cost_estimate: number | null;
  } | null;
}

interface OrderRaw {
  id: string;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  fees_vat_rate: number | null;
  sales_order_items: OrderItemRaw[];
}

interface ComputedItem {
  id: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  caHt: number;
  costProducts: number;
  costShipPurchase: number;
  costShipSale: number;
  costTotal: number;
  margin: number;
  marginPercent: number;
}

interface ComputedTotals {
  caHt: number;
  costProducts: number;
  costShipping: number;
  benefice: number;
  marginPercent: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(n);
}

function formatPercent(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1).replace('.', ',')}%`;
}

function marginBadgeVariant(percent: number): {
  label: string;
  className: string;
} {
  if (!Number.isFinite(percent)) {
    return { label: '—', className: 'bg-gray-100 text-gray-600' };
  }
  if (percent < 0) {
    return {
      label: 'Perte',
      className: 'bg-red-100 text-red-800 border-red-200',
    };
  }
  if (percent < 15) {
    return {
      label: 'Faible',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
    };
  }
  if (percent < 30) {
    return {
      label: 'Correcte',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
  }
  return {
    label: 'Saine',
    className: 'bg-green-100 text-green-800 border-green-200',
  };
}

// ---------------------------------------------------------------------------
// Calculations
// ---------------------------------------------------------------------------

function computeMargins(order: OrderRaw): {
  items: ComputedItem[];
  totals: ComputedTotals;
} {
  const orderShipping =
    (order.shipping_cost_ht ?? 0) +
    (order.handling_cost_ht ?? 0) +
    (order.insurance_cost_ht ?? 0);

  // CA total pour proratisation du coût de livraison vente sur chaque item
  const totalCaRaw = (order.sales_order_items ?? []).reduce((sum, item) => {
    const qty = item.quantity ?? 0;
    const price = item.unit_price_ht ?? 0;
    const discount = item.discount_percentage ?? 0;
    return sum + qty * price * (1 - discount / 100);
  }, 0);

  const items: ComputedItem[] = (order.sales_order_items ?? []).map(item => {
    const qty = item.quantity ?? 0;
    const price = item.unit_price_ht ?? 0;
    const discount = item.discount_percentage ?? 0;
    const caHt = qty * price * (1 - discount / 100);

    const unitCost = item.products?.cost_price ?? 0;
    const unitShipPurchase = item.products?.shipping_cost_estimate ?? 0;
    const costProducts = unitCost * qty;
    const costShipPurchase = unitShipPurchase * qty;

    // Répartition proportionnelle du transport vente sur chaque item
    const costShipSale =
      totalCaRaw > 0 ? (caHt / totalCaRaw) * orderShipping : 0;

    const costTotal = costProducts + costShipPurchase + costShipSale;
    const margin = caHt - costTotal;
    const marginPercent = caHt > 0 ? (margin / caHt) * 100 : NaN;

    return {
      id: item.id,
      productName: item.products?.name ?? 'Produit inconnu',
      productSku: item.products?.sku ?? null,
      quantity: qty,
      caHt,
      costProducts,
      costShipPurchase,
      costShipSale,
      costTotal,
      margin,
      marginPercent,
    };
  });

  const caTotal = items.reduce((s, i) => s + i.caHt, 0);
  const costProducts = items.reduce((s, i) => s + i.costProducts, 0);
  const costShipping = items.reduce(
    (s, i) => s + i.costShipPurchase + i.costShipSale,
    0
  );
  const benefice = caTotal - (costProducts + costShipping);
  const marginPercent = caTotal > 0 ? (benefice / caTotal) * 100 : NaN;

  return {
    items,
    totals: {
      caHt: caTotal,
      costProducts,
      costShipping,
      benefice,
      marginPercent,
    },
  };
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function OrderMarginReportCard({
  orderId,
}: OrderMarginReportCardProps): React.ReactNode {
  const { data, isLoading, error } = useQuery({
    queryKey: ['order-margin-report', orderId],
    queryFn: async (): Promise<OrderRaw | null> => {
      const supabase = createClient();
      const { data: row, error: err } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          shipping_cost_ht,
          handling_cost_ht,
          insurance_cost_ht,
          fees_vat_rate,
          sales_order_items (
            id,
            quantity,
            unit_price_ht,
            discount_percentage,
            product_id,
            products (id, name, sku, cost_price, shipping_cost_estimate)
          )
        `
        )
        .eq('id', orderId)
        .maybeSingle();
      if (err) throw new Error(err.message);
      return (row as unknown as OrderRaw) ?? null;
    },
    enabled: !!orderId,
  });

  const computed = useMemo(() => {
    if (!data) return null;
    return computeMargins(data);
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calcul de la marge...
        </CardContent>
      </Card>
    );
  }

  if (error || !computed) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-gray-500 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Impossible de calculer la marge.
        </CardContent>
      </Card>
    );
  }

  const { items, totals } = computed;

  if (items.length === 0) {
    return null;
  }

  const totalBadge = marginBadgeVariant(totals.marginPercent);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {totals.benefice >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          Récap gain / perte
          <Badge variant="outline" className={totalBadge.className}>
            {totalBadge.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tableau par item */}
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Produit</TableHead>
                <TableHead className="w-[70px] text-right">Qté</TableHead>
                <TableHead className="w-[110px] text-right">CA HT</TableHead>
                <TableHead className="hidden lg:table-cell w-[110px] text-right">
                  Coût produits
                </TableHead>
                <TableHead className="hidden xl:table-cell w-[110px] text-right">
                  Coût livraison
                </TableHead>
                <TableHead className="w-[110px] text-right">Marge €</TableHead>
                <TableHead className="w-[110px] text-right">Marge %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const badge = marginBadgeVariant(item.marginPercent);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm">{item.productName}</div>
                      {item.productSku && (
                        <div className="text-[11px] text-gray-500 font-mono">
                          {item.productSku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEur(item.caHt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right tabular-nums text-gray-700">
                      {formatEur(item.costProducts)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-right tabular-nums text-gray-700">
                      {formatEur(item.costShipPurchase + item.costShipSale)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatEur(item.margin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={badge.className}>
                        {formatPercent(item.marginPercent)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* 5 KPIs footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="rounded-md border bg-gray-50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              CA HT
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {formatEur(totals.caHt)}
            </div>
          </div>
          <div className="rounded-md border bg-gray-50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              Coût produits
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {formatEur(totals.costProducts)}
            </div>
          </div>
          <div className="rounded-md border bg-gray-50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              Coût livraison
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {formatEur(totals.costShipping)}
            </div>
          </div>
          <div
            className={`rounded-md border p-3 ${totals.benefice >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
          >
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              Bénéfice
            </div>
            <div
              className={`text-sm font-semibold tabular-nums ${totals.benefice >= 0 ? 'text-green-800' : 'text-red-800'}`}
            >
              {formatEur(totals.benefice)}
            </div>
          </div>
          <div
            className={`rounded-md border p-3 ${totals.marginPercent >= 30 ? 'bg-green-50 border-green-200' : totals.marginPercent >= 15 ? 'bg-yellow-50 border-yellow-200' : totals.marginPercent >= 0 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}
          >
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              Marge %
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {formatPercent(totals.marginPercent)}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500">
          Prix de revient calculé depuis le PMP produit (
          <code className="font-mono">products.cost_price</code>) mis à jour
          automatiquement à chaque réception fournisseur. Le transport vente est
          réparti proportionnellement au CA de chaque ligne.
        </p>
      </CardContent>
    </Card>
  );
}
