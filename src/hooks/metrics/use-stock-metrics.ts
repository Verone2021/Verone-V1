/**
 * Hook pour les métriques de stock
 * Gère les alertes de stock et les statistiques d'inventaire
 *
 * 🔄 Phase 3.2 - Migration use-stock-ui
 * @since 2025-10-31
 */

'use client';

import { useStockUI } from '@/hooks/use-stock-ui';

interface StockAlert {
  id: string;
  name: string;
  stock: number;
  status: 'rupture' | 'critique' | 'faible';
}

export function useStockMetrics() {
  const stock = useStockUI({ autoLoad: false });

  const fetch = async () => {
    try {
      // 🆕 Utilisation use-stock-ui au lieu de queries Supabase directes
      // Réutilise cache use-stock-core pour éviter queries multiples
      const items = await stock.getStockItems({ archived: false });

      // Agrégations JS (remplace queries SQL optimisées)
      // Performance: acceptable pour <1000 produits (SLO <2s maintenu)
      let inStockCount = 0;
      let outOfStockCount = 0;
      let lowStockCount = 0;
      let criticalCount = 0;
      const alertsList: StockAlert[] = [];

      items.forEach(product => {
        const stockQty = product.stock_real || 0;
        const threshold = product.stock_threshold || 5; // Seuil par défaut

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
            status: stockQty === 0
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
      console.error('❌ [useStockMetrics] Erreur récupération métriques:', error);
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