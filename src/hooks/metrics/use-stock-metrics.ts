/**
 * Hook pour les métriques de stock
 * Gère les alertes de stock et les statistiques d'inventaire
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

interface StockAlert {
  id: string;
  name: string;
  stock: number;
  status: 'rupture' | 'critique' | 'faible';
}

export function useStockMetrics() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetch = async () => {
    try {
      // OPTIMISATION PERFORMANCE <2s SLA : Agrégations SQL optimisées au lieu de récupérer tous les produits

      // 1. Tentative d'utilisation de la RPC optimisée
      const { data: stockMetrics, error: rpcError } = await supabase
        .rpc('get_stock_metrics_optimized');

      if (!rpcError && stockMetrics && Array.isArray(stockMetrics) && stockMetrics.length > 0) {
        const rpcData = stockMetrics[0];

        // Mapping des données RPC vers la structure attendue
        return {
          inStock: Number(rpcData.products_in_stock) || 0,
          outOfStock: Number(rpcData.products_out_of_stock) || 0,
          lowStock: Number(rpcData.products_low_stock) || 0,
          critical: Number(rpcData.products_low_stock) || 0, // Utilise low_stock pour critical en attendant
          alerts: [] // Sera récupéré séparément si nécessaire
        };
      }

      console.warn('RPC get_stock_metrics_optimized non disponible, utilisation fallback optimisé:', rpcError);

      // 2. Fallback avec requêtes SQL optimisées - CORRECTION des comparaisons entre colonnes
      // PostgREST ne supporte pas les comparaisons entre colonnes directement
      // On utilise une approche en 2 étapes : récupérer les données puis filtrer

      const [
        outOfStockResult,
        criticalResult,
        stockDataResult
      ] = await Promise.all([
        // Produits en rupture (quantité = 0) - Simple et direct
        supabase.from('products')
          .select('id', { count: 'exact', head: true })
          .eq('stock_quantity', 0),

        // Produits critiques (0 < quantité ≤ 2) - Simple et direct
        supabase.from('products')
          .select('id', { count: 'exact', head: true })
          .gt('stock_quantity', 0)
          .lte('stock_quantity', 2),

        // Récupération minimale des données pour comparaisons complexes
        supabase.from('products')
          .select('stock_quantity, min_stock')
          .not('stock_quantity', 'is', null)
          .not('min_stock', 'is', null)
      ]);

      // Calcul des métriques qui nécessitent des comparaisons entre colonnes
      const stockData = stockDataResult.data || [];
      let inStockCount = 0;
      let lowStockCount = 0;

      stockData.forEach(product => {
        const stock = product.stock_quantity || 0;
        const minStock = product.min_stock || 5; // Seuil par défaut

        if (stock > minStock) {
          inStockCount++;
        } else if (stock > 0 && stock <= minStock) {
          lowStockCount++;
        }
      });

      // 3. Récupération des alertes (limitée aux 10 produits les plus urgents)
      const { data: alertsData, error: alertsError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock')
        .lte('stock_quantity', 5) // Filtrer dès la requête pour limiter les données
        .order('stock_quantity', { ascending: true })
        .limit(10);

      // Transformation des alertes
      const alerts: StockAlert[] = (alertsData || []).map(p => ({
        id: p.id,
        name: p.name || 'Produit sans nom',
        stock: p.stock_quantity || 0,
        status: p.stock_quantity === 0
          ? 'rupture'
          : p.stock_quantity <= 2
          ? 'critique'
          : 'faible',
      }));

      return {
        inStock: inStockCount,
        outOfStock: outOfStockResult.count || 0,
        lowStock: lowStockCount,
        critical: criticalResult.count || 0,
        alerts,
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de stock:', error);
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