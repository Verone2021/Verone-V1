import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';

// =============================================
// VALORISATION REPORT - VUE FINANCIERE DU STOCK
// Valeur = stock_real x COALESCE(cost_net_avg, cost_price, 0)
// =============================================

interface ProductWithValuation {
  id: string;
  name: string;
  sku: string;
  stock_real: number;
  cost_price: number;
  cost_net_avg: number | null;
  unit_cost: number; // COALESCE(cost_net_avg, cost_price, 0)
  value: number; // stock_real * unit_cost
  value_cost_price: number; // stock_real * cost_price (prix achat HT)
  subcategory_name: string;
}

interface CategoryData {
  name: string;
  count: number;
  quantity: number;
  value: number;
  percentage: number;
}

interface ValueRange {
  label: string;
  min: number;
  max: number;
  count: number;
  value: number;
}

export interface ValorisationReportData {
  summary: {
    total_value_cost_net: number; // Valeur totale (cout de revient)
    total_value_cost_price: number; // Valeur totale (prix achat HT)
    total_products: number;
    average_unit_cost: number;
  };
  by_category: CategoryData[];
  top_20_by_value: ProductWithValuation[];
  value_distribution: ValueRange[];
  generated_at: string;
  /** Date de snapshot du stock (ISO). Null = stock courant.
   * Quand fourni, le stock_real est reconstruit historiquement via les
   * stock_movements postérieurs à cette date. */
  snapshot_at: string | null;
}

const VALUE_RANGES = [
  { label: '0 - 100 EUR', min: 0, max: 100 },
  { label: '100 - 500 EUR', min: 100, max: 500 },
  { label: '500 - 1 000 EUR', min: 500, max: 1000 },
  { label: '1 000 - 5 000 EUR', min: 1000, max: 5000 },
  { label: '5 000 - 10 000 EUR', min: 5000, max: 10000 },
  { label: '10 000+ EUR', min: 10000, max: Infinity },
];

export function useValorisationReport() {
  const [report, setReport] = useState<ValorisationReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const generateReport = useCallback(
    /**
     * @param snapshotAt - Date de snapshot du stock. Null = stock courant.
     *   Quand fourni, le stock_real de chaque produit est reconstruit
     *   historiquement via stock_real_now - SUM(quantity_change WHERE
     *   performed_at > snapshotAt). Utile pour snapshots comptables au 31/12.
     */
    async (snapshotAt: Date | null = null) => {
      setLoading(true);
      setError(null);

      try {
        // Query: produits non archivés (on prend tous les produits, on filtrera
        // le stock>0 APRES reconstruction historique si snapshotAt est défini).
        const productsQuery = supabase
          .from('products')
          .select(
            'id, name, sku, stock_real, cost_price, cost_net_avg, subcategory_id'
          )
          .is('archived_at', null);

        const { data: products, error: productsError } = snapshotAt
          ? await productsQuery
          : await productsQuery.gt('stock_real', 0);

        if (productsError) throw productsError;

        // Si snapshot historique demandé : reconstruire le stock à la date donnée
        // pour chaque produit. stock_at_snapshot = stock_real_now - SUM(mvts > snapshot)
        const stockOverrideMap = new Map<string, number>();
        if (snapshotAt) {
          const { data: movements, error: mvtError } = await supabase
            .from('stock_movements')
            .select('product_id, quantity_change')
            .gt('performed_at', snapshotAt.toISOString());

          if (mvtError) throw mvtError;

          const deltaPerProduct = new Map<string, number>();
          (movements ?? []).forEach(m => {
            const current = deltaPerProduct.get(m.product_id) ?? 0;
            deltaPerProduct.set(
              m.product_id,
              current + (m.quantity_change ?? 0)
            );
          });

          products.forEach(p => {
            const delta = deltaPerProduct.get(p.id) ?? 0;
            const stockAtSnapshot = (p.stock_real ?? 0) - delta;
            stockOverrideMap.set(p.id, Math.max(0, stockAtSnapshot));
          });
        }

        // Query: subcategories pour les noms
        const subcategoryIds = [
          ...new Set(
            products
              .map(p => p.subcategory_id)
              .filter((id): id is string => id != null)
          ),
        ];

        const subcategoryMap = new Map<string, string>();
        if (subcategoryIds.length > 0) {
          const { data: subcategories } = await supabase
            .from('subcategories')
            .select('id, name')
            .in('id', subcategoryIds);

          if (subcategories) {
            subcategories.forEach(sc => {
              subcategoryMap.set(sc.id, sc.name);
            });
          }
        }

        // Calcul valorisation par produit (avec stock historique si snapshotAt)
        const productsWithValuation: ProductWithValuation[] = products
          .map(p => {
            const stockReal = snapshotAt
              ? (stockOverrideMap.get(p.id) ?? 0)
              : (p.stock_real ?? 0);
            const costPrice = Number(p.cost_price) || 0;
            const costNetAvg =
              p.cost_net_avg != null ? Number(p.cost_net_avg) : null;
            const unitCost = costNetAvg ?? costPrice;

            return {
              id: p.id,
              name: p.name || 'Sans nom',
              sku: p.sku || '',
              stock_real: stockReal,
              cost_price: costPrice,
              cost_net_avg: costNetAvg,
              unit_cost: unitCost,
              value: stockReal * unitCost,
              value_cost_price: stockReal * costPrice,
              subcategory_name: p.subcategory_id
                ? (subcategoryMap.get(p.subcategory_id) ?? 'Non categorise')
                : 'Non categorise',
            };
          })
          // Pour le mode snapshot, filtrer les produits avec stock 0 à la date donnée
          .filter(p => p.stock_real > 0);

        // KPIs globaux
        const totalValueCostNet = productsWithValuation.reduce(
          (sum, p) => sum + p.value,
          0
        );
        const totalValueCostPrice = productsWithValuation.reduce(
          (sum, p) => sum + p.value_cost_price,
          0
        );
        const totalProducts = productsWithValuation.length;
        const averageUnitCost =
          totalProducts > 0 ? totalValueCostNet / totalProducts : 0;

        // Repartition par categorie
        const categoryMap = new Map<
          string,
          { count: number; quantity: number; value: number }
        >();
        productsWithValuation.forEach(p => {
          const existing = categoryMap.get(p.subcategory_name) ?? {
            count: 0,
            quantity: 0,
            value: 0,
          };
          categoryMap.set(p.subcategory_name, {
            count: existing.count + 1,
            quantity: existing.quantity + p.stock_real,
            value: existing.value + p.value,
          });
        });

        const byCategory: CategoryData[] = [...categoryMap.entries()]
          .map(([name, data]) => ({
            name,
            count: data.count,
            quantity: data.quantity,
            value: data.value,
            percentage:
              totalValueCostNet > 0
                ? (data.value / totalValueCostNet) * 100
                : 0,
          }))
          .sort((a, b) => b.value - a.value);

        // Top 20 produits par valeur
        const top20 = [...productsWithValuation]
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);

        // Distribution par tranche de valeur
        const valueDistribution: ValueRange[] = VALUE_RANGES.map(range => {
          const inRange = productsWithValuation.filter(
            p => p.value >= range.min && p.value < range.max
          );
          return {
            label: range.label,
            min: range.min,
            max: range.max,
            count: inRange.length,
            value: inRange.reduce((sum, p) => sum + p.value, 0),
          };
        });

        const reportData: ValorisationReportData = {
          summary: {
            total_value_cost_net: totalValueCostNet,
            total_value_cost_price: totalValueCostPrice,
            total_products: totalProducts,
            average_unit_cost: averageUnitCost,
          },
          by_category: byCategory,
          top_20_by_value: top20,
          value_distribution: valueDistribution,
          generated_at: new Date().toISOString(),
          snapshot_at: snapshotAt ? snapshotAt.toISOString() : null,
        };

        setReport(reportData);
        return reportData;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erreur lors de la generation du rapport valorisation';
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
