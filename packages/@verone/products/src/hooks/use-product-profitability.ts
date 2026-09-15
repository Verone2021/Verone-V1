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

export interface ProfitabilityKpis {
  totalPurchasedQty: number;
  stockValue: number | null;
}

export interface UseProductProfitabilityReturn {
  purchases: PurchaseRow[];
  kpis: ProfitabilityKpis;
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

// ---------- Hook ----------

export function useProductProfitability(
  productId: string,
  costNetAvg: number | null,
  stockReal: number | null
): UseProductProfitabilityReturn {
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

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

      setPurchases(purchaseRows);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erreur chargement rentabilité';
      console.error('[useProductProfitability] Error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchData().catch((err: unknown) => {
      console.error('[useProductProfitability] Unhandled:', err);
    });
  }, [fetchData]);

  const kpis = useMemo((): ProfitabilityKpis => {
    const totalPurchasedQty = purchases.reduce((s, p) => s + p.quantity, 0);
    const stockValue =
      stockReal != null && costNetAvg != null ? stockReal * costNetAvg : null;
    return { totalPurchasedQty, stockValue };
  }, [purchases, costNetAvg, stockReal]);

  const refetch = useCallback(() => {
    void fetchData().catch((err: unknown) => {
      console.error('[useProductProfitability] Refetch error:', err);
    });
  }, [fetchData]);

  return { purchases, kpis, loading, error, refetch };
}
