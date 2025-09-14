/**
 * Hook pour les métriques de stock
 * Gère les alertes de stock et les statistiques d'inventaire
 */

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface StockAlert {
  id: string;
  name: string;
  stock: number;
  status: 'rupture' | 'critique' | 'faible';
}

export function useStockMetrics() {
  const supabase = createClientComponentClient();

  const fetch = async () => {
    try {
      // Récupération de tous les produits avec leurs infos de stock
      // Note: Dans le futur, cela pourrait venir d'une table "inventory" dédiée
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, status, stock_quantity, min_stock_level');

      if (error) throw error;

      // Pour l'instant, on simule les quantités de stock car les colonnes
      // n'existent pas encore dans la base de données
      const simulatedProducts = products?.map(p => ({
        ...p,
        // Simulation basée sur le statut
        stock_quantity: p.status === 'in_stock'
          ? Math.floor(Math.random() * 50) + 10
          : p.status === 'out_of_stock'
          ? 0
          : Math.floor(Math.random() * 5),
        min_stock_level: 5, // Niveau minimum par défaut
      })) || [];

      // Calcul des métriques de stock
      const inStock = simulatedProducts.filter(p =>
        p.stock_quantity > p.min_stock_level
      ).length;

      const outOfStock = simulatedProducts.filter(p =>
        p.stock_quantity === 0
      ).length;

      const lowStock = simulatedProducts.filter(p =>
        p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level
      ).length;

      const critical = simulatedProducts.filter(p =>
        p.stock_quantity > 0 && p.stock_quantity <= 2
      ).length;

      // Génération des alertes de stock
      const alerts: StockAlert[] = simulatedProducts
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