/**
 * Hook pour les métriques produits
 * Récupère les statistiques sur les produits du catalogue
 */

'use client';

import { useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export function useProductMetrics() {
  // ✅ FIX: Use singleton client via useMemo
  const supabase = useMemo(() => createClient(), []);

  const fetch = async () => {
    try {
      // OPTIMISATION PERFORMANCE <2s SLA : Utilisation d'agrégations SQL au lieu de récupérer toutes les données
      // Calcul des métriques directement en base avec des requêtes optimisées

      // 1. Métriques principales par statut avec une seule requête agrégée
      const { data: statusMetrics, error: statusError } = await supabase.rpc(
        'get_products_status_metrics'
      );

      if (statusError) {
        console.warn(
          'RPC get_products_status_metrics non disponible, fallback vers requêtes SQL:',
          statusError
        );

        // Fallback vers requêtes SQL optimisées si la RPC n'existe pas encore
        const [
          totalResult,
          activeResult,
          inactiveResult,
          draftResult,
          stockAlertsResult,
        ] = await Promise.all([
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('product_status', 'active'),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .in('product_status', ['discontinued']),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .in('product_status', ['draft', 'preorder']),
          supabase
            .from('stock_alerts_unified_view')
            .select('id', { count: 'exact', head: true }),
        ]);

        // 2. Tendance: comparaison robuste (7 derniers jours vs 7 précédents)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // Produits créés dans les 7 derniers jours
        const { count: recentCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        // Produits créés entre il y a 14 jours et il y a 7 jours
        const { count: previousCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString());

        const total = totalResult.count ?? 0;

        // Calcul robuste de la tendance - toujours retourner un nombre valide
        const recentValidCount = Number(recentCount) || 0;
        const previousValidCount = Number(previousCount) || 0;

        let trend = 0;
        if (previousValidCount > 0) {
          trend =
            ((recentValidCount - previousValidCount) / previousValidCount) *
            100;
        } else if (recentValidCount > 0) {
          trend = 100; // 100% d'augmentation si aucun produit la période précédente
        }

        // S'assurer que trend est toujours un nombre valide
        trend = Number.isFinite(trend) ? Math.round(trend * 10) / 10 : 0;

        const result = {
          total,
          active: activeResult.count ?? 0,
          inactive: inactiveResult.count ?? 0,
          draft: draftResult.count ?? 0,
          stockAlerts: stockAlertsResult.count ?? 0,
          trend,
        };

        return result;
      }

      // Si la RPC existe, utiliser directement ses résultats
      return (
        statusMetrics ?? {
          total: 0,
          active: 0,
          inactive: 0,
          draft: 0,
          stockAlerts: 0,
          trend: 0,
        }
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des métriques produits:',
        error
      );
      // Retour de valeurs par défaut en cas d'erreur
      return {
        total: 0,
        active: 0,
        inactive: 0,
        draft: 0,
        stockAlerts: 0,
        trend: 0,
      };
    }
  };

  return { fetch };
}
