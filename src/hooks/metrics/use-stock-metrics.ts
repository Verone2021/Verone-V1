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
      // Récupération de tous les produits avec leurs infos de stock
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, status, stock_quantity, min_stock_level');

      if (error) throw error;

      // Utilisation des vraies données depuis la base
      const productsWithDefaults = products?.map(p => ({
        ...p,
        stock_quantity: p.stock_quantity ?? 0,
        min_stock_level: p.min_stock_level ?? 5,
      })) || [];

      // Calcul des métriques de stock
      const inStock = productsWithDefaults.filter(p =>
        p.stock_quantity > p.min_stock_level
      ).length;

      const outOfStock = productsWithDefaults.filter(p =>
        p.stock_quantity === 0
      ).length;

      const lowStock = productsWithDefaults.filter(p =>
        p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level
      ).length;

      const critical = productsWithDefaults.filter(p =>
        p.stock_quantity > 0 && p.stock_quantity <= 2
      ).length;

      // Génération des alertes de stock
      const alerts: StockAlert[] = productsWithDefaults
        .filter(p => p.stock_quantity <= p.min_stock_level)
        .map(p => ({
          id: p.id,
          name: p.name || 'Produit sans nom',
          stock: p.stock_quantity,
          status: p.stock_quantity === 0
            ? 'rupture'
            : p.stock_quantity <= 2
            ? 'critique'
            : 'faible',
        }))
        .sort((a, b) => a.stock - b.stock) // Tri par quantité croissante
        .slice(0, 10); // Limite aux 10 alertes les plus urgentes

      return {
        inStock,
        outOfStock,
        lowStock,
        critical,
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