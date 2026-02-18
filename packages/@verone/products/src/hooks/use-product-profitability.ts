'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ---------- Types ----------

interface PurchaseItem {
  quantity: number;
  unit_price_ht: number;
  unit_cost_net: number | null;
  total_ht: number | null;
  discount_percentage: number;
  purchase_order: {
    id: string;
    po_number: string;
    order_date: string | null;
    status: string;
    supplier: {
      trade_name: string | null;
      legal_name: string;
    };
  };
}

interface SaleItem {
  quantity: number;
  unit_price_ht: number;
  total_ht: number | null;
  discount_percentage: number;
  sales_order: {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    customer_type: string;
  };
}

export interface PurchaseRow {
  date: string | null;
  orderId: string;
  orderNumber: string;
  supplierName: string;
  quantity: number;
  unitPriceHt: number;
  unitCostNet: number | null;
  totalHt: number;
}

export interface SaleRow {
  date: string;
  orderId: string;
  orderNumber: string;
  customerType: string;
  quantity: number;
  unitPriceHt: number;
  costNetAvg: number | null;
  marginUnit: number | null;
  marginPercent: number | null;
  totalHt: number;
}

export interface ProfitabilityKpis {
  totalPurchasedQty: number;
  totalSoldQty: number;
  grossMargin: number | null;
  stockValue: number | null;
}

export interface ProfitabilitySummary {
  totalGrossMargin: number | null;
  avgMarginPerUnit: number | null;
  avgMarginPercent: number | null;
  totalRevenueHt: number;
}

export interface UseProductProfitabilityReturn {
  purchases: PurchaseRow[];
  sales: SaleRow[];
  kpis: ProfitabilityKpis;
  summary: ProfitabilitySummary;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------- Constants ----------

const PURCHASE_STATUSES = [
  'validated',
  'partially_received',
  'received',
] as const;
const SALE_STATUSES = ['shipped', 'delivered', 'closed'] as const;

// ---------- Hook ----------

export function useProductProfitability(
  productId: string,
  costNetAvg: number | null,
  stockReal: number | null
): UseProductProfitabilityReturn {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // --- Fetch purchases ---
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchase_order_items')
        .select(
          `quantity, unit_price_ht, unit_cost_net, total_ht, discount_percentage,
          purchase_order:purchase_orders!inner(
            id, po_number, order_date, status,
            supplier:organisations!purchase_orders_supplier_id_fkey(trade_name, legal_name)
          )`
        )
        .eq('product_id', productId)
        .in('purchase_orders.status', [...PURCHASE_STATUSES]);

      if (purchaseError) {
        console.error(
          '[useProductProfitability] Purchase fetch error:',
          purchaseError
        );
      }

      // --- Fetch sales ---
      const { data: salesData, error: salesError } = await supabase
        .from('sales_order_items')
        .select(
          `quantity, unit_price_ht, total_ht, discount_percentage,
          sales_order:sales_orders!inner(
            id, order_number, created_at, status, customer_type
          )`
        )
        .eq('product_id', productId)
        .in('sales_orders.status', [...SALE_STATUSES]);

      if (salesError) {
        console.error(
          '[useProductProfitability] Sales fetch error:',
          salesError
        );
      }

      // --- Transform purchases ---
      const purchaseRows: PurchaseRow[] = (
        (purchaseData ?? []) as unknown as PurchaseItem[]
      )
        .filter(p => p.purchase_order)
        .map(p => ({
          date: p.purchase_order.order_date,
          orderId: p.purchase_order.id,
          orderNumber: p.purchase_order.po_number,
          supplierName:
            p.purchase_order.supplier?.trade_name ??
            p.purchase_order.supplier?.legal_name ??
            '—',
          quantity: p.quantity,
          unitPriceHt: Number(p.unit_price_ht),
          unitCostNet: p.unit_cost_net != null ? Number(p.unit_cost_net) : null,
          totalHt: Number(p.total_ht ?? p.quantity * Number(p.unit_price_ht)),
        }))
        .sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

      // --- Transform sales ---
      const saleRows: SaleRow[] = ((salesData ?? []) as unknown as SaleItem[])
        .filter(s => s.sales_order)
        .map(s => {
          const unitPrice = Number(s.unit_price_ht);
          const marginUnit = costNetAvg != null ? unitPrice - costNetAvg : null;
          const marginPercent =
            marginUnit != null && unitPrice > 0
              ? (marginUnit / unitPrice) * 100
              : null;

          return {
            date: s.sales_order.created_at,
            orderId: s.sales_order.id,
            orderNumber: s.sales_order.order_number,
            customerType: s.sales_order.customer_type,
            quantity: s.quantity,
            unitPriceHt: unitPrice,
            costNetAvg,
            marginUnit,
            marginPercent,
            totalHt: Number(s.total_ht ?? s.quantity * unitPrice),
          };
        })
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      setPurchases(purchaseRows);
      setSales(saleRows);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erreur chargement rentabilité';
      console.error('[useProductProfitability] Error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId, costNetAvg]);

  useEffect(() => {
    void fetchData().catch((err: unknown) => {
      console.error('[useProductProfitability] Unhandled:', err);
    });
  }, [fetchData]);

  // --- Computed KPIs ---
  const kpis = useMemo((): ProfitabilityKpis => {
    const totalPurchasedQty = purchases.reduce((s, p) => s + p.quantity, 0);
    const totalSoldQty = sales.reduce((s, r) => s + r.quantity, 0);

    const totalRevenueHt = sales.reduce((s, r) => s + r.totalHt, 0);
    const totalCostSold = costNetAvg != null ? totalSoldQty * costNetAvg : null;
    const grossMargin =
      totalCostSold != null ? totalRevenueHt - totalCostSold : null;

    const stockValue =
      stockReal != null && costNetAvg != null ? stockReal * costNetAvg : null;

    return { totalPurchasedQty, totalSoldQty, grossMargin, stockValue };
  }, [purchases, sales, costNetAvg, stockReal]);

  // --- Computed summary ---
  const summary = useMemo((): ProfitabilitySummary => {
    const totalRevenueHt = sales.reduce((s, r) => s + r.totalHt, 0);
    const totalSoldQty = sales.reduce((s, r) => s + r.quantity, 0);

    const totalCostSold = costNetAvg != null ? totalSoldQty * costNetAvg : null;
    const totalGrossMargin =
      totalCostSold != null ? totalRevenueHt - totalCostSold : null;
    const avgMarginPerUnit =
      totalGrossMargin != null && totalSoldQty > 0
        ? totalGrossMargin / totalSoldQty
        : null;
    const avgMarginPercent =
      totalGrossMargin != null && totalRevenueHt > 0
        ? (totalGrossMargin / totalRevenueHt) * 100
        : null;

    return {
      totalGrossMargin,
      avgMarginPerUnit,
      avgMarginPercent,
      totalRevenueHt,
    };
  }, [sales, costNetAvg]);

  const refetch = useCallback(() => {
    void fetchData().catch((err: unknown) => {
      console.error('[useProductProfitability] Refetch error:', err);
    });
  }, [fetchData]);

  return { purchases, sales, kpis, summary, loading, error, refetch };
}
