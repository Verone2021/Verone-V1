'use client';

/**
 * useProductPricingDashboard — agrégation de toutes les données pricing pour
 * l'onglet Tarification du produit : historique des PO avec prix d'achat et
 * prix de revient, commissions par canal, sélections LinkMe.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ---------- Types exportés ----------

export interface PurchaseOrderRow {
  id: string;
  poId: string;
  poNumber: string;
  orderDate: string | null;
  supplierName: string;
  quantity: number;
  unitPriceHt: number;
  unitCostNet: number | null;
  totalHt: number;
}

export interface CostStats {
  costNetAvg: number | null;
  costNetMin: number | null;
  costNetMax: number | null;
  costNetLast: number | null;
  lastPurchaseDate: string | null;
  totalQty12m: number;
  purchasesCount: number;
}

export interface ChannelCommission {
  channelId: string;
  channelCode: string;
  commissionRate: number | null;
  minMarginRate: number | null;
  maxMarginRate: number | null;
  suggestedMarginRate: number | null;
}

export interface ProductPricingDashboardData {
  purchases: PurchaseOrderRow[];
  costStats: CostStats;
  channelCommissions: ChannelCommission[];
}

// ---------- Types internes pour Supabase ----------

interface RawPoItem {
  id: string;
  quantity: number;
  unit_price_ht: number;
  unit_cost_net: number | null;
  total_ht: number | null;
  purchase_order: {
    id: string;
    po_number: string;
    order_date: string | null;
    supplier: {
      legal_name: string;
      trade_name: string | null;
    } | null;
  } | null;
}

interface RawChannelPricing {
  channel_id: string;
  channel_commission_rate: number | null;
  min_margin_rate: number | null;
  max_margin_rate: number | null;
  suggested_margin_rate: number | null;
  sales_channels: {
    code: string;
  } | null;
}

const PURCHASE_STATUSES = [
  'validated',
  'partially_received',
  'received',
] as const;

// ---------- Hook ----------

export function useProductPricingDashboard(productId: string | null): {
  data: ProductPricingDashboardData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<ProductPricingDashboardData>({
    purchases: [],
    costStats: {
      costNetAvg: null,
      costNetMin: null,
      costNetMax: null,
      costNetLast: null,
      lastPurchaseDate: null,
      totalQty12m: 0,
      purchasesCount: 0,
    },
    channelCommissions: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [poResult, channelResult] = await Promise.all([
        supabase
          .from('purchase_order_items')
          .select(
            `id, quantity, unit_price_ht, unit_cost_net, total_ht,
            purchase_order:purchase_orders!inner(
              id, po_number, order_date,
              supplier:organisations!purchase_orders_supplier_id_fkey(legal_name, trade_name)
            )`
          )
          .eq('product_id', productId)
          .in('purchase_orders.status', [...PURCHASE_STATUSES]),

        supabase
          .from('channel_pricing')
          .select(
            `channel_id, channel_commission_rate, min_margin_rate, max_margin_rate, suggested_margin_rate,
            sales_channels!inner(code)`
          )
          .eq('product_id', productId),
      ]);

      const rawItems = (poResult.data ?? []) as unknown as RawPoItem[];
      const purchases: PurchaseOrderRow[] = rawItems
        .filter(p => p.purchase_order != null)
        .map(p => ({
          id: p.id,
          poId: p.purchase_order!.id,
          poNumber: p.purchase_order!.po_number,
          orderDate: p.purchase_order!.order_date,
          supplierName:
            p.purchase_order!.supplier?.trade_name ??
            p.purchase_order!.supplier?.legal_name ??
            '—',
          quantity: p.quantity,
          unitPriceHt: Number(p.unit_price_ht),
          unitCostNet: p.unit_cost_net != null ? Number(p.unit_cost_net) : null,
          totalHt: Number(p.total_ht ?? p.quantity * Number(p.unit_price_ht)),
        }))
        .sort((a, b) => {
          if (!a.orderDate) return 1;
          if (!b.orderDate) return -1;
          return (
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          );
        });

      // Compute cost stats from purchase history
      const costsWithQty = purchases
        .filter(p => p.unitCostNet != null && p.unitCostNet > 0)
        .map(p => ({ cost: p.unitCostNet as number, qty: p.quantity }));

      let costNetAvg: number | null = null;
      let costNetMin: number | null = null;
      let costNetMax: number | null = null;
      if (costsWithQty.length > 0) {
        const totalQty = costsWithQty.reduce((s, p) => s + p.qty, 0);
        const weightedSum = costsWithQty.reduce(
          (s, p) => s + p.cost * p.qty,
          0
        );
        costNetAvg = totalQty > 0 ? weightedSum / totalQty : null;
        costNetMin = Math.min(...costsWithQty.map(p => p.cost));
        costNetMax = Math.max(...costsWithQty.map(p => p.cost));
      }

      const lastPurchase = purchases.find(p => p.unitCostNet != null) ?? null;

      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const totalQty12m = purchases
        .filter(p => p.orderDate && new Date(p.orderDate) >= twelveMonthsAgo)
        .reduce((s, p) => s + p.quantity, 0);

      const costStats: CostStats = {
        costNetAvg,
        costNetMin,
        costNetMax,
        costNetLast: lastPurchase?.unitCostNet ?? null,
        lastPurchaseDate: lastPurchase?.orderDate ?? null,
        totalQty12m,
        purchasesCount: purchases.length,
      };

      // Channel commissions
      const rawChannels = (channelResult.data ??
        []) as unknown as RawChannelPricing[];
      const channelCommissions: ChannelCommission[] = rawChannels
        .filter(c => c.sales_channels != null)
        .map(c => ({
          channelId: c.channel_id,
          channelCode: c.sales_channels!.code,
          commissionRate:
            c.channel_commission_rate != null
              ? Number(c.channel_commission_rate)
              : null,
          minMarginRate:
            c.min_margin_rate != null ? Number(c.min_margin_rate) : null,
          maxMarginRate:
            c.max_margin_rate != null ? Number(c.max_margin_rate) : null,
          suggestedMarginRate:
            c.suggested_margin_rate != null
              ? Number(c.suggested_margin_rate)
              : null,
        }));

      setData({ purchases, costStats, channelCommissions });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erreur chargement dashboard pricing';
      console.error('[useProductPricingDashboard] Error:', msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchAll().catch((err: unknown) => {
      console.error('[useProductPricingDashboard] Unhandled:', err);
    });
  }, [fetchAll]);

  const refetch = useCallback(() => {
    void fetchAll().catch((err: unknown) => {
      console.error('[useProductPricingDashboard] Refetch error:', err);
    });
  }, [fetchAll]);

  return { data, isLoading, error, refetch };
}
