/**
 * Hook pour les métriques de stock
 * Gère les alertes de stock et les statistiques d'inventaire
 *
 * @since 2025-10-31
 * @updated 2026-01-13 - Fix: Suppression @ts-nocheck, utilisation Supabase direct
 */

'use client';

import { createClient } from '@verone/utils/supabase/client';

interface StockAlert {
  id: string;
  name: string;
  stock: number;
  status: 'rupture' | 'critique' | 'faible';
}

export function useStockMetrics() {
  const supabase = createClient();

  const fetch = async () => {
    try {
      // Query directe Supabase pour récupérer les produits avec stock
      const { data: items, error } = await supabase
        .from('products')
        .select('id, name, stock_real, min_stock, cost_price')
        .is('archived_at', null);

      if (error) {
        console.error('❌ [useStockMetrics] Erreur query:', error);
        return {
          inStock: 0,
          outOfStock: 0,
          lowStock: 0,
          critical: 0,
          alerts: [],
        };
      }

      // Agrégations JS
      let inStockCount = 0;
      let outOfStockCount = 0;
      let lowStockCount = 0;
      let criticalCount = 0;
      const alertsList: StockAlert[] = [];

      (items || []).forEach(product => {
        const stockQty = product.stock_real || 0;
        const threshold = product.min_stock || 5; // Seuil par défaut

        // Compteurs
        if (stockQty === 0) {
          outOfStockCount++;
        } else if (stockQty <= 2) {
          criticalCount++;
        } else if (stockQty <= threshold) {
          lowStockCount++;
        } else {
          inStockCount++;
        }

        // Alertes (top 10 produits critiques)
        if (stockQty <= 5 && alertsList.length < 10) {
          alertsList.push({
            id: product.id,
            name: product.name || 'Produit sans nom',
            stock: stockQty,
            status:
              stockQty === 0
                ? 'rupture'
                : stockQty <= 2
                  ? 'critique'
                  : 'faible',
          });
        }
      });

      // Trier alertes par quantité croissante
      alertsList.sort((a, b) => a.stock - b.stock);

      return {
        inStock: inStockCount,
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
        critical: criticalCount,
        alerts: alertsList.slice(0, 10), // Limiter à 10
      };
    } catch (error) {
      console.error(
        '❌ [useStockMetrics] Erreur récupération métriques:',
        error
      );
      return {
        inStock: 0,
        outOfStock: 0,
        lowStock: 0,
        critical: 0,
        alerts: [],
      };
    }
  };

  return { fetch };
}
