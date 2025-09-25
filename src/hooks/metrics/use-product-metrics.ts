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
      // OPTIMISATION PERFORMANCE <2s SLA : Utilisation d'agrégations SQL au lieu de récupérer toutes les données
      // Calcul des métriques directement en base avec des requêtes optimisées

      // 1. Métriques principales par statut avec une seule requête agrégée
      const { data: statusMetrics, error: statusError } = await supabase
        .rpc('get_products_status_metrics');

      if (statusError) {
        console.warn('RPC get_products_status_metrics non disponible, fallback vers requêtes SQL:', statusError);

        // Fallback vers requêtes SQL optimisées si la RPC n'existe pas encore
        const [totalResult, activeResult, inactiveResult, draftResult] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }).in('status', ['in_stock']),
          supabase.from('products').select('id', { count: 'exact', head: true }).in('status', ['out_of_stock', 'discontinued']),
          supabase.from('products').select('id', { count: 'exact', head: true }).in('status', ['coming_soon', 'preorder'])
        ]);

        // 2. Tendance: comparaison avec hier (optimisée)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);

        const { count: yesterdayCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .lte('created_at', yesterday.toISOString());

        const total = totalResult.count || 0;
        const trend = yesterdayCount && yesterdayCount > 0
          ? ((total - yesterdayCount) / yesterdayCount) * 100
          : 0;

        return {
          total,
          active: activeResult.count || 0,
          inactive: inactiveResult.count || 0,
          draft: draftResult.count || 0,
          trend: Math.round(trend * 10) / 10,
        };
      }

      // Si la RPC existe, utiliser directement ses résultats
      return statusMetrics || {
        total: 0,
        active: 0,
        inactive: 0,
        draft: 0,
        trend: 0,
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