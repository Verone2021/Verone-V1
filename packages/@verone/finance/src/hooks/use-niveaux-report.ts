import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// =============================================
// NIVEAUX REPORT — Stock actuel vs seuils + jours de couverture
// Classification : critical (≤ min) / warning (≤ reorder) / healthy / overstock
// =============================================

export type StockLevel = 'critical' | 'warning' | 'healthy' | 'overstock';

export interface ProductLevel {
  id: string;
  name: string;
  sku: string;
  stock_real: number;
  min_stock: number;
  reorder_point: number;
  cost_price: number;
  stock_forecasted_in: number;
  stock_forecasted_out: number;
  velocity_per_day: number;
  days_of_coverage: number; // stock_real / velocity (Infinity si rien ne tourne)
  level: StockLevel;
  immobilized_value: number;
}

export interface NiveauxReportData {
  summary: {
    period_days: number;
    period_from: string;
    period_to: string;
    total_products: number;
    critical_count: number;
    warning_count: number;
    healthy_count: number;
    overstock_count: number;
    total_immobilized: number;
    avg_days_of_coverage: number;
  };
  critical: ProductLevel[];
  warning: ProductLevel[];
  overstock: ProductLevel[];
  generated_at: string;
}

interface UseNiveauxReportParams {
  dateFrom: string;
  dateTo: string;
}

const VELOCITY_WINDOW_DAYS = 90;
// Surstock = > 6 mois de couverture (180 jours). Seuil pragmatique.
const OVERSTOCK_DAYS_THRESHOLD = 180;

export function useNiveauxReport({ dateFrom, dateTo }: UseNiveauxReportParams) {
  const [report, setReport] = useState<NiveauxReportData | null>(null);
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

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(
          'id, name, sku, stock_real, min_stock, reorder_point, cost_price, stock_forecasted_in, stock_forecasted_out'
        )
        .is('archived_at', null);

      if (productsError) throw productsError;

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

      const all: ProductLevel[] = products.map(p => {
        const stockReal = p.stock_real ?? 0;
        const minStock = p.min_stock ?? 0;
        const reorderPoint = p.reorder_point ?? minStock;
        const costPrice = Number(p.cost_price) || 0;
        const sold90d = soldPerProduct.get(p.id) ?? 0;
        const velocity = sold90d / VELOCITY_WINDOW_DAYS;
        const daysOfCoverage = velocity > 0 ? stockReal / velocity : Infinity;
        const immobilizedValue = stockReal * costPrice;

        let level: StockLevel;
        if (stockReal <= minStock && minStock > 0) level = 'critical';
        else if (stockReal <= reorderPoint && reorderPoint > 0)
          level = 'warning';
        else if (daysOfCoverage > OVERSTOCK_DAYS_THRESHOLD && stockReal > 0)
          level = 'overstock';
        else level = 'healthy';

        return {
          id: p.id,
          name: p.name || 'Sans nom',
          sku: p.sku || '',
          stock_real: stockReal,
          min_stock: minStock,
          reorder_point: reorderPoint,
          cost_price: costPrice,
          stock_forecasted_in: p.stock_forecasted_in ?? 0,
          stock_forecasted_out: p.stock_forecasted_out ?? 0,
          velocity_per_day: velocity,
          days_of_coverage: daysOfCoverage,
          level,
          immobilized_value: immobilizedValue,
        };
      });

      const critical = all
        .filter(p => p.level === 'critical')
        .sort((a, b) => a.stock_real - b.stock_real);
      const warning = all
        .filter(p => p.level === 'warning')
        .sort((a, b) => a.days_of_coverage - b.days_of_coverage);
      const overstock = all
        .filter(p => p.level === 'overstock')
        .sort((a, b) => b.immobilized_value - a.immobilized_value)
        .slice(0, 30);
      const healthyCount = all.filter(p => p.level === 'healthy').length;

      const totalImmobilized = all.reduce(
        (sum, p) => sum + p.immobilized_value,
        0
      );

      // Couverture moyenne pondérée par stock (les produits qui dorment ne polluent pas la moyenne)
      const withFinite = all.filter(
        p => isFinite(p.days_of_coverage) && p.days_of_coverage > 0
      );
      const avgDaysOfCoverage =
        withFinite.length > 0
          ? withFinite.reduce((sum, p) => sum + p.days_of_coverage, 0) /
            withFinite.length
          : 0;

      const reportData: NiveauxReportData = {
        summary: {
          period_days: periodDays,
          period_from: dateFrom,
          period_to: dateTo,
          total_products: all.length,
          critical_count: critical.length,
          warning_count: warning.length,
          healthy_count: healthyCount,
          overstock_count: all.filter(p => p.level === 'overstock').length,
          total_immobilized: totalImmobilized,
          avg_days_of_coverage: avgDaysOfCoverage,
        },
        critical,
        warning,
        overstock,
        generated_at: new Date().toISOString(),
      };

      setReport(reportData);
      return reportData;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la génération du rapport niveaux';
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
