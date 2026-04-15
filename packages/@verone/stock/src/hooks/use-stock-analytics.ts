import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';

export type {
  ABCClass,
  XYZClass,
  ProductAnalytics,
  AnalyticsSummary,
  AnalyticsClassData,
  AnalyticsReport,
  StockAnalyticsRaw,
} from './use-stock-analytics.types';

export { ABC_CLASSES, XYZ_CLASSES } from './use-stock-analytics.types';

import {
  ABC_CLASSES,
  XYZ_CLASSES,
  calculateCoefficientOfVariation,
  type ABCClass,
  type XYZClass,
  type StockAnalyticsRaw,
  type ProductAnalytics,
  type AnalyticsClassData,
  type AnalyticsReport,
} from './use-stock-analytics.types';

// ================== HOOK ==================

export function useStockAnalytics() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  /**
   * Génère le rapport analytics complet
   * 1. Appelle RPC get_stock_analytics()
   * 2. Calcule ABC (Pareto sur valeur)
   * 3. Calcule XYZ (Coefficient de variation sur sorties)
   */
  const generateReport = useCallback(
    async (periodDays = 90) => {
      setLoading(true);
      setError(null);

      try {
        // ÉTAPE 1: Appel RPC get_stock_analytics
        const { data, error: rpcError } = await (
          supabase as unknown as {
            rpc: (
              fn: string,
              params: Record<string, unknown>
            ) => Promise<{ data: unknown; error: unknown }>;
          }
        ).rpc('get_stock_analytics', {
          p_period_days: periodDays,
          p_organisation_id: null,
        });

        if (rpcError) throw rpcError;

        const rawProducts = (data ?? []) as unknown as StockAnalyticsRaw[];

        if (!rawProducts || rawProducts.length === 0) {
          toast({
            title: 'Aucun produit',
            description: 'Aucun produit à analyser',
            variant: 'default',
          });
          setReport(null);
          return null;
        }

        // ÉTAPE 2: Calcul Valeurs + Tri Décroissant
        const productsWithValue = rawProducts
          .map(product => ({
            ...product,
            stock_value: product.stock_current * product.cost_price,
          }))
          .sort((a, b) => b.stock_value - a.stock_value);

        const totalValue = productsWithValue.reduce(
          (sum, p) => sum + p.stock_value,
          0
        );

        if (totalValue === 0) {
          toast({
            title: 'Valeur nulle',
            description:
              'La valeur totale du stock est nulle (cost_price manquant?)',
            variant: 'default',
          });
          setReport(null);
          return null;
        }

        // ÉTAPE 3: Classification ABC (Pareto)
        let cumulativeValue = 0;
        const productsWithABC = productsWithValue.map((product, index) => {
          cumulativeValue += product.stock_value;
          const cumulativePercentage = (cumulativeValue / totalValue) * 100;
          const cumulativeRatio = cumulativeValue / totalValue;

          let abcClass: ABCClass = 'C';
          if (cumulativeRatio <= ABC_CLASSES[0].threshold) {
            abcClass = 'A';
          } else if (cumulativeRatio <= ABC_CLASSES[1].threshold) {
            abcClass = 'B';
          }

          return {
            ...product,
            cumulative_value: cumulativeValue,
            cumulative_value_percentage: cumulativePercentage,
            abc_class: abcClass,
            abc_rank: index + 1,
          };
        });

        // ÉTAPE 4: Classification XYZ (Variabilité)
        const productsWithXYZ: ProductAnalytics[] = productsWithABC.map(
          product => {
            const monthlySales = [
              product.out_30d,
              product.out_90d / 3,
              product.out_365d / 12,
            ].filter(val => val > 0);

            const { cv, mean, stddev } =
              calculateCoefficientOfVariation(monthlySales);

            let xyzClass: XYZClass = 'Z';
            if (cv < XYZ_CLASSES[0].threshold) {
              xyzClass = 'X';
            } else if (cv < XYZ_CLASSES[1].threshold) {
              xyzClass = 'Y';
            }

            return {
              ...product,
              xyz_class: xyzClass,
              xyz_cv: cv,
              xyz_stddev: stddev,
              xyz_mean: mean,
              combined_class: `${product.abc_class}${xyzClass}`,
            };
          }
        );

        // ÉTAPE 5: Calculs Statistiques Globaux
        const totalProducts = productsWithXYZ.length;
        const totalQuantity = productsWithXYZ.reduce(
          (sum, p) => sum + p.stock_current,
          0
        );

        const abcA = productsWithXYZ.filter(p => p.abc_class === 'A');
        const abcB = productsWithXYZ.filter(p => p.abc_class === 'B');
        const abcC = productsWithXYZ.filter(p => p.abc_class === 'C');
        const xyzX = productsWithXYZ.filter(p => p.xyz_class === 'X');
        const xyzY = productsWithXYZ.filter(p => p.xyz_class === 'Y');
        const xyzZ = productsWithXYZ.filter(p => p.xyz_class === 'Z');

        const avgADU =
          productsWithXYZ.reduce((sum, p) => sum + p.adu, 0) / totalProducts;
        const avgTurnover =
          productsWithXYZ.reduce((sum, p) => sum + p.turnover_rate, 0) /
          totalProducts;
        const avgCoverage =
          productsWithXYZ
            .filter(p => p.coverage_days < 900)
            .reduce((sum, p) => sum + p.coverage_days, 0) / totalProducts;

        const belowMin = productsWithXYZ.filter(
          p => p.stock_current <= p.stock_minimum
        ).length;
        const inactive30d = productsWithXYZ.filter(
          p => p.days_inactive !== null && p.days_inactive > 30
        ).length;

        // ÉTAPE 6: Métriques par Classe
        const makeClassStats = (
          classes: typeof ABC_CLASSES | typeof XYZ_CLASSES,
          filterFn: (p: ProductAnalytics, id: string) => boolean
        ): AnalyticsClassData[] =>
          [...classes].map(cls => {
            const products = productsWithXYZ.filter(p => filterFn(p, cls.id));
            const classValue = products.reduce(
              (sum, p) => sum + p.stock_value,
              0
            );
            const classQuantity = products.reduce(
              (sum, p) => sum + p.stock_current,
              0
            );

            return {
              class_id: cls.id,
              label: cls.label,
              description: cls.description,
              count: products.length,
              quantity: classQuantity,
              value: classValue,
              percentage: totalValue > 0 ? (classValue / totalValue) * 100 : 0,
              color: cls.color,
              textColor: cls.textColor,
              priority: cls.priority,
            };
          });

        const abcClassStats = makeClassStats(
          ABC_CLASSES,
          (p, id) => p.abc_class === id
        );
        const xyzClassStats = makeClassStats(
          XYZ_CLASSES,
          (p, id) => p.xyz_class === id
        );

        // ÉTAPE 7: Matrice Combinée (9 cases)
        const combinedMatrix: Record<string, ProductAnalytics[]> = {};
        for (const abcCls of ['A', 'B', 'C']) {
          for (const xyzCls of ['X', 'Y', 'Z']) {
            const key = `${abcCls}${xyzCls}`;
            combinedMatrix[key] = productsWithXYZ.filter(
              p => p.combined_class === key
            );
          }
        }

        // ÉTAPE 8: TOP 20 Insights
        const top20HighValue = [...productsWithXYZ].slice(0, 20);
        const top20LowTurnover = [...productsWithXYZ]
          .filter(p => p.turnover_rate > 0)
          .sort((a, b) => a.turnover_rate - b.turnover_rate)
          .slice(0, 20);
        const top20HighADU = [...productsWithXYZ]
          .sort((a, b) => b.adu - a.adu)
          .slice(0, 20);

        // ÉTAPE 9: Construction Rapport Final
        const reportData: AnalyticsReport = {
          summary: {
            total_products: totalProducts,
            total_quantity: totalQuantity,
            total_value: totalValue,
            abc_a_count: abcA.length,
            abc_b_count: abcB.length,
            abc_c_count: abcC.length,
            abc_a_value_percentage:
              totalValue > 0
                ? (abcA.reduce((sum, p) => sum + p.stock_value, 0) /
                    totalValue) *
                  100
                : 0,
            abc_b_value_percentage:
              totalValue > 0
                ? (abcB.reduce((sum, p) => sum + p.stock_value, 0) /
                    totalValue) *
                  100
                : 0,
            abc_c_value_percentage:
              totalValue > 0
                ? (abcC.reduce((sum, p) => sum + p.stock_value, 0) /
                    totalValue) *
                  100
                : 0,
            xyz_x_count: xyzX.length,
            xyz_y_count: xyzY.length,
            xyz_z_count: xyzZ.length,
            average_adu: avgADU,
            average_turnover_rate: avgTurnover,
            average_coverage_days: avgCoverage,
            products_below_minimum: belowMin,
            products_inactive_30d: inactive30d,
          },
          products: productsWithXYZ,
          abc_classes: abcClassStats,
          xyz_classes: xyzClassStats,
          combined_matrix: combinedMatrix,
          top_20_high_value: top20HighValue,
          top_20_low_turnover: top20LowTurnover,
          top_20_high_adu: top20HighADU,
          generated_at: new Date().toISOString(),
        };

        setReport(reportData);

        toast({
          title: 'Rapport Analytics généré',
          description: `${totalProducts} produits analysés - ${abcA.length} A, ${abcB.length} B, ${abcC.length} C`,
          variant: 'default',
        });

        return reportData;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur lors de la génération du rapport analytics';
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
    },
    [supabase, toast]
  );

  return {
    report,
    loading,
    error,
    generateReport,
  };
}
