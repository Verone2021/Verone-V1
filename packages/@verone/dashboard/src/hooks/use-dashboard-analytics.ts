/**
 * 📊 Hook Dashboard Analytics - Données temporelles pour graphiques Recharts
 *
 * Récupère les métriques d'évolution sur 30 derniers jours :
 * - Chiffre d'affaires (sales_orders)
 * - Produits ajoutés (products)
 * - Mouvements stock (stock_movements)
 * - Commandes fournisseurs (purchase_orders)
 *
 * Date: 2025-10-14
 */

'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Types pour les données analytics
export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface ProductsDataPoint {
  week: string;
  count: number;
}

export interface StockMovementDataPoint {
  date: string;
  entrees: number;
  sorties: number;
}

export interface PurchaseOrderDataPoint {
  week: string;
  amount: number;
}

export interface DashboardAnalytics {
  revenue: RevenueDataPoint[];
  products: ProductsDataPoint[];
  stockMovements: StockMovementDataPoint[];
  purchaseOrders: PurchaseOrderDataPoint[];
}

export function useDashboardAnalytics() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Date il y a 30 jours
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString();

        // ============ GRAPHIQUE 1 : Évolution CA (30 derniers jours) ============
        const { data: salesOrders, error: salesError } = await supabase
          .from('sales_orders')
          .select('created_at, total_ttc')
          .gte('created_at', startDate)
          .not('status', 'eq', 'cancelled')
          .order('created_at', { ascending: true })
          .limit(5000);

        if (salesError) throw salesError;

        // Grouper par jour et sommer le CA
        const revenueByDay = (salesOrders || []).reduce(
          (acc: Record<string, number>, order) => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + (order.total_ttc || 0);
            return acc;
          },
          {}
        );

        const revenueData: RevenueDataPoint[] = Object.entries(revenueByDay)
          .map(([date, revenue]) => ({
            date: new Date(date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
            }),
            revenue: Math.round(revenue),
          }))
          .sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('-'));
            const dateB = new Date(b.date.split('/').reverse().join('-'));
            return dateA.getTime() - dateB.getTime();
          });

        // ============ GRAPHIQUE 2 : Produits ajoutés (par semaine) ============
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('created_at')
          .gte('created_at', startDate)
          .order('created_at', { ascending: true })
          .limit(5000);

        if (productsError) throw productsError;

        // Grouper par semaine
        const productsByWeek = (products || []).reduce(
          (acc: Record<string, number>, product) => {
            const date = new Date(
              product.created_at || new Date().toISOString()
            );
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            acc[weekKey] = (acc[weekKey] || 0) + 1;
            return acc;
          },
          {}
        );

        const productsData: ProductsDataPoint[] = Object.entries(
          productsByWeek
        ).map(([week, count]) => ({
          week: `S${Math.ceil(new Date(week).getDate() / 7)}`,
          count,
        }));

        // ============ GRAPHIQUE 3 : Mouvements stock (30 derniers jours) ============
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select('created_at, quantity_change, movement_type')
          .gte('created_at', startDate)
          .order('created_at', { ascending: true })
          .limit(5000);

        if (movementsError) throw movementsError;

        // Grouper par jour et type (entrées/sorties)
        const movementsByDay = (movements || []).reduce(
          (acc: Record<string, { entrees: number; sorties: number }>, mov) => {
            const date = new Date(mov.created_at).toISOString().split('T')[0];
            if (!acc[date]) {
              acc[date] = { entrees: 0, sorties: 0 };
            }

            if (mov.movement_type === 'IN') {
              acc[date].entrees += Math.abs(mov.quantity_change);
            } else if (mov.movement_type === 'OUT') {
              acc[date].sorties += Math.abs(mov.quantity_change);
            }

            return acc;
          },
          {}
        );

        const stockMovementsData: StockMovementDataPoint[] = Object.entries(
          movementsByDay
        ).map(([date, { entrees, sorties }]) => ({
          date: new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
          }),
          entrees,
          sorties,
        }));

        // ============ GRAPHIQUE 4 : Commandes fournisseurs (par semaine) ============
        const { data: purchaseOrders, error: purchaseError } = await supabase
          .from('purchase_orders')
          .select('created_at, total_ht')
          .gte('created_at', startDate)
          .not('status', 'eq', 'cancelled')
          .order('created_at', { ascending: true })
          .limit(5000);

        if (purchaseError) throw purchaseError;

        // Grouper par semaine
        const purchaseByWeek = (purchaseOrders || []).reduce(
          (acc: Record<string, number>, order) => {
            const date = new Date(order.created_at);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            acc[weekKey] = (acc[weekKey] || 0) + (order.total_ht || 0);
            return acc;
          },
          {}
        );

        const purchaseOrdersData: PurchaseOrderDataPoint[] = Object.entries(
          purchaseByWeek
        ).map(([week, amount]) => ({
          week: `S${Math.ceil(new Date(week).getDate() / 7)}`,
          amount: Math.round(amount),
        }));

        // ============ ASSEMBLAGE FINAL ============
        setAnalytics({
          revenue: revenueData,
          products: productsData,
          stockMovements: stockMovementsData,
          purchaseOrders: purchaseOrdersData,
        });
      } catch (err) {
        console.error('[Analytics] Erreur récupération données:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  return {
    analytics,
    isLoading,
    error,
  };
}
