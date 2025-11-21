/**
 * 🏆 Hook: Top 5 Produits - Vérone
 *
 * Récupère les 5 produits les plus performants basés sur les ventes réelles
 * et les mouvements de stock pour affichage dashboard.
 */

'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Type pour les produits top 5 du dashboard
export interface TopProduct {
  id: string;
  name: string;
  sales: number; // Nombre de ventes sur la période
  stock: number; // Stock actuel
  trend: number; // Tendance en % (positif = hausse, négatif = baisse)
  revenue?: number; // Chiffre d'affaires généré (optionnel)
}

interface UseTopProductsResult {
  topProducts: TopProduct[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer les top 5 produits les plus vendus
 * Analyse les lignes de commande (order_items) sur les 30 derniers jours
 */
export function useTopProducts(days = 30, limit = 5): UseTopProductsResult {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Date de début pour la période d'analyse
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Récupérer les ventes par produit sur la période
      // On joint sales_order_items avec sales_orders pour filtrer par date
      const { data: salesData, error: salesError } = await supabase
        .from('sales_order_items')
        .select(
          `
          product_id,
          quantity,
          unit_price_ht,
          sales_orders!inner (
            created_at,
            status
          )
        `
        )
        .gte('sales_orders.created_at', startDate.toISOString())
        .in('sales_orders.status', [
          'draft',
          'validated',
          'partially_shipped',
          'shipped',
          'delivered',
        ]);

      if (salesError) {
        console.error('Erreur récupération ventes:', salesError);
        throw salesError;
      }

      // Si pas de ventes, retourner array vide
      if (!salesData || salesData.length === 0) {
        setTopProducts([]);
        return;
      }

      // Agréger les ventes par produit
      const productSalesMap = new Map<
        string,
        { quantity: number; revenue: number }
      >();

      salesData.forEach((item: any) => {
        const productId = item.product_id;
        const quantity = item.quantity || 0;
        const revenue = (item.quantity || 0) * (item.unit_price_ht || 0);

        if (productSalesMap.has(productId)) {
          const current = productSalesMap.get(productId)!;
          productSalesMap.set(productId, {
            quantity: current.quantity + quantity,
            revenue: current.revenue + revenue,
          });
        } else {
          productSalesMap.set(productId, { quantity, revenue });
        }
      });

      // Trier par quantité vendue et prendre le top N
      const topProductIds = Array.from(productSalesMap.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, limit)
        .map(([id]) => id);

      if (topProductIds.length === 0) {
        setTopProducts([]);
        return;
      }

      // Récupérer les détails des produits + stock actuel
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, stock_real')
        .in('id', topProductIds);

      if (productsError) {
        console.error('Erreur récupération produits:', productsError);
        throw productsError;
      }

      if (!productsData) {
        setTopProducts([]);
        return;
      }

      // Pour chaque produit, calculer la tendance (ventes mois dernier vs mois précédent)
      const trendPromises = topProductIds.map(async productId => {
        // Période précédente (même durée que la période actuelle)
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - days);

        const { data: prevSales } = await supabase
          .from('sales_order_items')
          .select(
            `
            quantity,
            sales_orders!inner (
              created_at,
              status
            )
          `
          )
          .eq('product_id', productId)
          .gte('sales_orders.created_at', prevStartDate.toISOString())
          .lt('sales_orders.created_at', startDate.toISOString())
          .in('sales_orders.status', [
            'draft',
            'validated',
            'partially_shipped',
            'shipped',
            'delivered',
          ]);

        const prevQuantity =
          prevSales?.reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0
          ) || 0;
        const currentQuantity = productSalesMap.get(productId)?.quantity || 0;

        // Calculer la tendance en %
        if (prevQuantity === 0) {
          return currentQuantity > 0 ? 100 : 0; // 100% si ventes actuelles et 0 avant
        }

        return Math.round(
          ((currentQuantity - prevQuantity) / prevQuantity) * 100
        );
      });

      const trends = await Promise.all(trendPromises);

      // Construire le résultat final
      const result: TopProduct[] = productsData.map((product: any) => {
        const sales = productSalesMap.get(product.id);
        const trendIndex = topProductIds.indexOf(product.id);

        return {
          id: product.id,
          name: product.name || 'Produit sans nom',
          sales: sales?.quantity || 0,
          stock: product.stock_real ?? product.stock_quantity ?? 0,
          trend: trends[trendIndex] || 0,
          revenue: sales?.revenue || 0,
        };
      });

      // Trier par ventes (au cas où l'ordre aurait changé)
      result.sort((a, b) => b.sales - a.sales);

      setTopProducts(result);
    } catch (err: any) {
      console.error('Erreur chargement top produits:', err);
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
  }, [days, limit]);

  return {
    topProducts,
    loading,
    error,
    refresh: fetchTopProducts,
  };
}
