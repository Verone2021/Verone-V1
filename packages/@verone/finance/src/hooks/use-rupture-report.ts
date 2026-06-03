import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// =============================================
// RUPTURE REPORT — Stocks à risque (rupture / faible / approchant)
// Classification urgence + perte CA estimée via vélocité historique 90j.
// =============================================

export type RuptureSeverity = 'rupture' | 'critical' | 'warning';

export interface ProductRupture {
  id: string;
  name: string;
  sku: string;
  stock_real: number;
  min_stock: number;
  reorder_point: number;
  cost_price: number;
  target_price: number | null;
  stock_forecasted_in: number;
  velocity_per_day: number; // moyenne unités vendues / jour sur 90j
  days_until_stockout: number; // stock_real / velocity (Infinity si pas de vélocité)
  severity: RuptureSeverity;
  estimated_revenue_loss_30d: number; // marge perdue si rupture persiste 30j
}

export interface RuptureReportData {
  summary: {
    period_days: number;
    period_from: string;
    period_to: string;
    rupture_count: number; // stock_real = 0
    critical_count: number; // 0 < stock_real ≤ min_stock
    warning_count: number; // min_stock < stock_real ≤ reorder_point
    total_estimated_loss_30d: number;
    total_immobilized_recovery: number; // valeur PO en attente (stock_forecasted_in × cost_price)
  };
  in_rupture: ProductRupture[]; // déjà à 0
  critical: ProductRupture[]; // urgent
  warning: ProductRupture[]; // à surveiller
  generated_at: string;
}

interface UseRuptureReportParams {
  dateFrom: string;
  dateTo: string;
}

const VELOCITY_WINDOW_DAYS = 90; // calcul vélocité sur 90j glissants (toujours)

export function useRuptureReport({ dateFrom, dateTo }: UseRuptureReportParams) {
  const [report, setReport] = useState<RuptureReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const periodFromIso = new Date(dateFrom).toISOString();
      const periodToIso = new Date(`${dateTo}T23:59:59.999Z`).toISOString();
      const periodMs =
        new Date(periodToIso).getTime() - new Date(periodFromIso).getTime();
      const periodDays = Math.max(
        1,
        Math.round(periodMs / (1000 * 60 * 60 * 24))
      );

      // 1) Tous produits non archivés
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(
          'id, name, sku, stock_real, min_stock, reorder_point, cost_price, target_price, stock_forecasted_in'
        )
        .is('archived_at', null);

      if (productsError) throw productsError;

      // 2) Vélocité : OUT sur les 90j glissants (depuis maintenant - 90j)
      const velocityStartIso = new Date(
        Date.now() - VELOCITY_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
      const { data: movements, error: mvtError } = await supabase
        .from('stock_movements')
        .select('product_id, quantity_change')
        .eq('movement_type', 'OUT')
        .gte('performed_at', velocityStartIso);

      if (mvtError) throw mvtError;

      const soldPerProduct = new Map<string, number>();
      (movements ?? []).forEach(m => {
        const current = soldPerProduct.get(m.product_id) ?? 0;
        soldPerProduct.set(
          m.product_id,
          current + Math.abs(m.quantity_change ?? 0)
        );
      });

      // 3) Classer chaque produit
      const allAtRisk: ProductRupture[] = [];

      products.forEach(p => {
        const stockReal = p.stock_real ?? 0;
        const minStock = p.min_stock ?? 0;
        const reorderPoint = p.reorder_point ?? minStock;
        const costPrice = Number(p.cost_price) || 0;
        const targetPrice =
          p.target_price != null ? Number(p.target_price) : null;
        const stockForecasted = p.stock_forecasted_in ?? 0;

        // Classer la sévérité
        let severity: RuptureSeverity | null = null;
        if (stockReal <= 0) severity = 'rupture';
        else if (stockReal <= minStock && minStock > 0) severity = 'critical';
        else if (stockReal <= reorderPoint && reorderPoint > 0)
          severity = 'warning';

        // On ne garde que les produits à risque
        if (!severity) return;

        // Vélocité = unités vendues / jour sur les 90j glissants
        const sold90d = soldPerProduct.get(p.id) ?? 0;
        const velocity = sold90d / VELOCITY_WINDOW_DAYS;

        // Jours avant rupture (si pas encore en rupture)
        const daysUntilStockout =
          velocity > 0 ? stockReal / velocity : stockReal === 0 ? 0 : Infinity;

        // Marge unitaire estimée (si target_price disponible)
        const marginUnit =
          targetPrice != null && targetPrice > costPrice
            ? targetPrice - costPrice
            : 0;

        // Perte CA estimée si rupture persiste 30 jours
        const daysOfMissedSales =
          severity === 'rupture' ? 30 : Math.max(0, 30 - daysUntilStockout); // partie des 30 jours où on sera réellement à 0
        const estimatedLoss30d = velocity * daysOfMissedSales * marginUnit;

        allAtRisk.push({
          id: p.id,
          name: p.name || 'Sans nom',
          sku: p.sku || '',
          stock_real: stockReal,
          min_stock: minStock,
          reorder_point: reorderPoint,
          cost_price: costPrice,
          target_price: targetPrice,
          stock_forecasted_in: stockForecasted,
          velocity_per_day: velocity,
          days_until_stockout: daysUntilStockout,
          severity,
          estimated_revenue_loss_30d: estimatedLoss30d,
        });
      });

      // Trier dans chaque catégorie par perte estimée puis nom
      const sortByLossDesc = (a: ProductRupture, b: ProductRupture) =>
        b.estimated_revenue_loss_30d - a.estimated_revenue_loss_30d ||
        a.name.localeCompare(b.name);

      const inRupture = allAtRisk
        .filter(p => p.severity === 'rupture')
        .sort(sortByLossDesc);
      const critical = allAtRisk
        .filter(p => p.severity === 'critical')
        .sort(sortByLossDesc);
      const warning = allAtRisk
        .filter(p => p.severity === 'warning')
        .sort(sortByLossDesc);

      const totalEstimatedLoss = allAtRisk.reduce(
        (sum, p) => sum + p.estimated_revenue_loss_30d,
        0
      );

      const totalRecovery = allAtRisk.reduce(
        (sum, p) => sum + p.stock_forecasted_in * p.cost_price,
        0
      );

      const reportData: RuptureReportData = {
        summary: {
          period_days: periodDays,
          period_from: dateFrom,
          period_to: dateTo,
          rupture_count: inRupture.length,
          critical_count: critical.length,
          warning_count: warning.length,
          total_estimated_loss_30d: totalEstimatedLoss,
          total_immobilized_recovery: totalRecovery,
        },
        in_rupture: inRupture,
        critical,
        warning,
        generated_at: new Date().toISOString(),
      };

      setReport(reportData);
      return reportData;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la génération du rapport ruptures';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, toast, dateFrom, dateTo]);

  return { report, loading, error, generateReport };
}
