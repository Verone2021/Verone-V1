/**
 * Hook pour les métriques produits
 * Récupère les statistiques sur les produits du catalogue
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

export function useProductMetrics() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetch = async () => {
    try {
      // Récupération du nombre total de produits et leur statut
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, status, created_at', { count: 'exact' });

      if (productsError) throw productsError;

      // Récupération des produits créés hier pour calculer la tendance
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const { count: yesterdayCount } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .lt('created_at', yesterday.toISOString());

      // Calcul des métriques
      const total = products?.length || 0;
      const active = products?.filter(p => p.status === 'in_stock').length || 0;
      const inactive = products?.filter(p =>
        p.status === 'out_of_stock' || p.status === 'discontinued'
      ).length || 0;
      const draft = products?.filter(p =>
        p.status === 'coming_soon' || p.status === 'preorder'
      ).length || 0;

      // Calcul de la tendance (évolution par rapport à hier)
      const trend = yesterdayCount && yesterdayCount > 0
        ? ((total - yesterdayCount) / yesterdayCount) * 100
        : 0;

      return {
        total,
        active,
        inactive,
        draft,
        trend: Math.round(trend * 10) / 10, // Arrondi à 1 décimale
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques produits:', error);
      // Retour de valeurs par défaut en cas d'erreur
      return {
        total: 0,
        active: 0,
        inactive: 0,
        draft: 0,
        trend: 0,
      };
    }
  };

  return { fetch };
}