import { useState, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

// =============================================
// STOCK ANALYTICS - MÉTRIQUES AVANCÉES ERP
// Phase 3.4: Stock Analytics Page
// @since 2025-11-02
// =============================================

// ================== TYPES RPC ==================

/** Résultat brut de la fonction RPC get_stock_analytics */
interface StockAnalyticsRaw {
  product_id: string;
  product_name: string;
  sku: string;
  product_image_url?: string | null; // URL image principale produit
  stock_current: number;
  stock_minimum: number;
  cost_price: number;
  out_30d: number;
  out_90d: number;
  out_365d: number;
  in_30d: number;
  in_90d: number;
  in_365d: number;
  adu: number; // Average Daily Usage
  turnover_rate: number; // Taux de rotation
  coverage_days: number; // Couverture stock (jours)
  days_inactive: number | null; // Jours depuis dernière sortie
  movement_history: Array<{ date: string; qty: number; type: string }>;
  last_exit_date: string | null;
  last_entry_date: string | null;
}

// ================== CLASSIFICATIONS ==================

/** Classification ABC (Pareto 80/15/5 sur valeur) */
export type ABCClass = 'A' | 'B' | 'C';

/** Classification XYZ (Variabilité demande) */
export type XYZClass = 'X' | 'Y' | 'Z';

export const ABC_CLASSES = [
  {
    id: 'A' as const,
    label: 'Classe A',
    description: '80% de la valeur',
    threshold: 0.8,
    color: 'bg-green-100',
    textColor: 'text-green-800',
    priority: 'Critique',
  },
  {
    id: 'B' as const,
    label: 'Classe B',
    description: '15% de la valeur',
    threshold: 0.95,
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    priority: 'Important',
  },
  {
    id: 'C' as const,
    label: 'Classe C',
    description: '5% de la valeur',
    threshold: 1.0,
    color: 'bg-gray-100',
    textColor: 'text-gray-800',
    priority: 'Faible',
  },
] as const;

export const XYZ_CLASSES = [
  {
    id: 'X' as const,
    label: 'Classe X',
    description: 'Demande stable (CV < 0.5)',
    threshold: 0.5,
    color: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    priority: 'Prévisible',
  },
  {
    id: 'Y' as const,
    label: 'Classe Y',
    description: 'Demande fluctuante (0.5 ≤ CV < 1.0)',
    threshold: 1.0,
    color: 'bg-amber-100',
    textColor: 'text-amber-800',
    priority: 'Modéré',
  },
  {
    id: 'Z' as const,
    label: 'Classe Z',
    description: 'Demande irrégulière (CV ≥ 1.0)',
    threshold: Infinity,
    color: 'bg-red-100',
    textColor: 'text-red-800',
    priority: 'Imprévisible',
  },
] as const;

// ================== PRODUCT ENRICHI ==================

/** Produit avec analytics complètes (RPC + ABC + XYZ) */
export interface ProductAnalytics extends StockAnalyticsRaw {
  // Valeur stock
  stock_value: number;
  cumulative_value: number;
  cumulative_value_percentage: number;

  // Classification ABC
  abc_class: ABCClass;
  abc_rank: number;

  // Classification XYZ
  xyz_class: XYZClass;
  xyz_cv: number; // Coefficient de variation
  xyz_stddev: number; // Écart-type
  xyz_mean: number; // Moyenne

  // Classification combinée
  combined_class: string; // Ex: "AX", "BY", "CZ"
}

// ================== SUMMARY DATA ==================

export interface AnalyticsSummary {
  total_products: number;
  total_quantity: number;
  total_value: number;

  // ABC Distribution
  abc_a_count: number;
  abc_b_count: number;
  abc_c_count: number;
  abc_a_value_percentage: number;
  abc_b_value_percentage: number;
  abc_c_value_percentage: number;

  // XYZ Distribution
  xyz_x_count: number;
  xyz_y_count: number;
  xyz_z_count: number;

  // Métriques globales
  average_adu: number;
  average_turnover_rate: number;
  average_coverage_days: number;
  products_below_minimum: number;
  products_inactive_30d: number;
}

export interface AnalyticsClassData {
  class_id: string;
  label: string;
  description: string;
  count: number;
  quantity: number;
  value: number;
  percentage: number;
  color: string;
  textColor: string;
  priority: string;
}

export interface AnalyticsReport {
  summary: AnalyticsSummary;
  products: ProductAnalytics[];
  abc_classes: AnalyticsClassData[];
  xyz_classes: AnalyticsClassData[];
  combined_matrix: Record<string, ProductAnalytics[]>; // Ex: { "AX": [...], "BY": [...] }
  top_20_high_value: ProductAnalytics[];
  top_20_low_turnover: ProductAnalytics[];
  top_20_high_adu: ProductAnalytics[];
  generated_at: string;
}

// ================== HOOK ==================

export function useStockAnalytics() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  /**
   * Calcule le coefficient de variation (écart-type / moyenne)
   * Utilisé pour la classification XYZ
   */
  const calculateCoefficientOfVariation = (
    values: number[]
  ): { cv: number; mean: number; stddev: number } => {
    if (values.length === 0) return { cv: 0, mean: 0, stddev: 0 };

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    if (mean === 0) return { cv: 0, mean: 0, stddev: 0 };

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stddev = Math.sqrt(variance);
    const cv = stddev / mean;

    return { cv, mean, stddev };
  };

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
        // ============================================
        // ÉTAPE 1: Appel RPC get_stock_analytics
        // ============================================
        // RPC function not yet in generated Supabase types - using any cast
        const { data, error: rpcError } = await (supabase as any).rpc(
          'get_stock_analytics',
          { p_period_days: periodDays, p_organisation_id: null }
        );

        if (rpcError) throw rpcError;

        // Cast manuel du résultat (types Supabase non générés pour cette RPC)
        const rawProducts = (data || []) as unknown as StockAnalyticsRaw[];

        if (!rawProducts || rawProducts.length === 0) {
          toast({
            title: 'Aucun produit',
            description: 'Aucun produit à analyser',
            variant: 'default',
          });
          setReport(null);
          return null;
        }

        // ============================================
        // ÉTAPE 2: Calcul Valeurs + Tri Décroissant
        // ============================================
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

        // ============================================
        // ÉTAPE 3: Classification ABC (Pareto)
        // ============================================
        let cumulativeValue = 0;
        const productsWithABC = productsWithValue.map((product, index) => {
          cumulativeValue += product.stock_value;
          const cumulativePercentage = (cumulativeValue / totalValue) * 100;
          const cumulativeRatio = cumulativeValue / totalValue;

          let abcClass: ABCClass = 'C';
          if (cumulativeRatio <= ABC_CLASSES[0].threshold) {
            abcClass = 'A'; // 0-80%
          } else if (cumulativeRatio <= ABC_CLASSES[1].threshold) {
            abcClass = 'B'; // 80-95%
          }

          return {
            ...product,
            cumulative_value: cumulativeValue,
            cumulative_value_percentage: cumulativePercentage,
            abc_class: abcClass,
            abc_rank: index + 1,
          };
        });

        // ============================================
        // ÉTAPE 4: Classification XYZ (Variabilité)
        // ============================================
        const productsWithXYZ: ProductAnalytics[] = productsWithABC.map(
          product => {
            // Variabilité basée sur sorties mensuelles (out_30d, out_90d, out_365d)
            // Normalisation: out_90d/3 et out_365d/12 pour avoir sorties mensuelles comparables
            const monthlySales = [
              product.out_30d, // 1 mois
              product.out_90d / 3, // 3 mois → moyenne mensuelle
              product.out_365d / 12, // 12 mois → moyenne mensuelle
            ].filter(val => val > 0); // Ignorer les zéros (pas de données)

            const { cv, mean, stddev } =
              calculateCoefficientOfVariation(monthlySales);

            let xyzClass: XYZClass = 'Z';
            if (cv < XYZ_CLASSES[0].threshold) {
              xyzClass = 'X'; // CV < 0.5
            } else if (cv < XYZ_CLASSES[1].threshold) {
              xyzClass = 'Y'; // 0.5 ≤ CV < 1.0
            }

            const combinedClass = `${product.abc_class}${xyzClass}`;

            return {
              ...product,
              xyz_class: xyzClass,
              xyz_cv: cv,
              xyz_stddev: stddev,
              xyz_mean: mean,
              combined_class: combinedClass,
            };
          }
        );

        // ============================================
        // ÉTAPE 5: Calculs Statistiques Globaux
        // ============================================
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

        // ============================================
        // ÉTAPE 6: Métriques par Classe
        // ============================================
        const abcClassStats: AnalyticsClassData[] = ABC_CLASSES.map(cls => {
          const products = productsWithXYZ.filter(p => p.abc_class === cls.id);
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

        const xyzClassStats: AnalyticsClassData[] = XYZ_CLASSES.map(cls => {
          const products = productsWithXYZ.filter(p => p.xyz_class === cls.id);
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

        // ============================================
        // ÉTAPE 7: Matrice Combinée (9 cases)
        // ============================================
        const combinedMatrix: Record<string, ProductAnalytics[]> = {};
        for (const abcCls of ['A', 'B', 'C']) {
          for (const xyzCls of ['X', 'Y', 'Z']) {
            const key = `${abcCls}${xyzCls}`;
            combinedMatrix[key] = productsWithXYZ.filter(
              p => p.combined_class === key
            );
          }
        }

        // ============================================
        // ÉTAPE 8: TOP 20 Insights
        // ============================================
        const top20HighValue = [...productsWithXYZ].slice(0, 20);
        const top20LowTurnover = [...productsWithXYZ]
          .filter(p => p.turnover_rate > 0)
          .sort((a, b) => a.turnover_rate - b.turnover_rate)
          .slice(0, 20);
        const top20HighADU = [...productsWithXYZ]
          .sort((a, b) => b.adu - a.adu)
          .slice(0, 20);

        // ============================================
        // ÉTAPE 9: Construction Rapport Final
        // ============================================
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
      } catch (err: any) {
        const errorMessage =
          err.message || 'Erreur lors de la génération du rapport analytics';
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
