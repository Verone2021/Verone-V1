'use client';

import { useEffect, useState, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import {
  StockAlertCard,
  type StockAlert,
  type StockAlertType,
} from './StockAlertCard';

interface StockAlertsBannerProps {
  productId: string;
  onActionClick?: (alert: StockAlert) => void;
}

const PRIORITY_ORDER: Record<StockAlertType, number> = {
  out_of_stock: 3,
  low_stock: 2,
  low_stock_forecast: 1,
  no_stock_but_ordered: 0,
};

/**
 * Banniere d'alertes stock a afficher en haut d'une fiche produit.
 * Fetch les alertes actives du produit via stock_alerts_unified_view,
 * les regroupe en une seule carte avec badges multiples.
 * Ne rend rien si aucune alerte active.
 *
 * @since 2026-04-20 (BO-STOCK-007 A2)
 */
export function StockAlertsBanner({
  productId,
  onActionClick,
}: StockAlertsBannerProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchAlerts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stock_alerts_unified_view')
          .select(
            'id, product_id, product_name, sku, stock_real, stock_forecasted_in, stock_forecasted_out, min_stock, shortage_quantity, alert_type, severity, is_in_draft, quantity_in_draft, draft_order_id, draft_order_number, validated, validated_at'
          )
          .eq('product_id', productId)
          .neq('alert_type', 'none')
          .limit(10);

        if (error) throw error;
        if (cancelled) return;

        const mapped: StockAlert[] = (data ?? []).map(
          (a): StockAlert => ({
            id: a.id ?? '',
            product_id: a.product_id ?? '',
            product_name: a.product_name ?? '',
            sku: a.sku ?? '',
            stock_real: a.stock_real ?? 0,
            stock_forecasted_in: a.stock_forecasted_in ?? 0,
            stock_forecasted_out: a.stock_forecasted_out ?? 0,
            min_stock: a.min_stock ?? 0,
            shortage_quantity: a.shortage_quantity ?? 0,
            alert_type: (a.alert_type as StockAlertType | null) ?? 'low_stock',
            severity:
              (a.severity as 'info' | 'warning' | 'critical' | null) ??
              'warning',
            is_in_draft: a.is_in_draft ?? false,
            quantity_in_draft: a.quantity_in_draft,
            draft_order_id: a.draft_order_id,
            draft_order_number: a.draft_order_number,
            validated: a.validated ?? false,
            validated_at: a.validated_at,
          })
        );

        setAlerts(mapped);
      } catch (err) {
        console.error('[StockAlertsBanner] fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAlerts();
    return () => {
      cancelled = true;
    };
  }, [productId, supabase]);

  if (loading || alerts.length === 0) return null;

  // Grouper (deja filtres par productId, donc 1 seul groupe)
  const sorted = [...alerts].sort(
    (a, b) => PRIORITY_ORDER[b.alert_type] - PRIORITY_ORDER[a.alert_type]
  );
  const primary = sorted[0];
  const additionalTypes = sorted.slice(1).map(a => a.alert_type);

  return (
    <div className="mb-4">
      <StockAlertCard
        alert={primary}
        additionalAlertTypes={additionalTypes}
        onActionClick={onActionClick}
      />
    </div>
  );
}
