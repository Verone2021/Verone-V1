/**
 * Hook pour les métriques d'activité
 * Trace l'activité récente et les tendances
 *
 * @optimized 2026-01-24 - Ajout cache module-level 5 minutes
 */

'use client';

import { useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

interface RecentAction {
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface ActivityMetricsData {
  today: number;
  yesterday: number;
  trend: number;
  recentActions: RecentAction[];
}

// =====================================================================
// CACHE MODULE-LEVEL (évite requêtes répétées)
// Pattern: Cache avec timestamp, durée 5 minutes
// =====================================================================

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface ActivityCacheEntry {
  data: ActivityMetricsData;
  timestamp: number;
}

let activityMetricsCache: ActivityCacheEntry | null = null;

function isCacheValid(): boolean {
  if (!activityMetricsCache) return false;
  const now = Date.now();
  return now - activityMetricsCache.timestamp < CACHE_DURATION_MS;
}

function getCachedMetrics(): ActivityMetricsData | null {
  if (isCacheValid()) {
    return activityMetricsCache!.data;
  }
  return null;
}

function setCachedMetrics(data: ActivityMetricsData): void {
  activityMetricsCache = {
    data,
    timestamp: Date.now(),
  };
}

// Fonction pour invalider le cache (utilisable par d'autres hooks)
export function invalidateActivityMetricsCache(): void {
  activityMetricsCache = null;
}

export function useActivityMetrics() {
  // ✅ FIX: Use singleton client via useMemo
  const supabase = useMemo(() => createClient(), []);

  const fetch = async (forceRefresh = false): Promise<ActivityMetricsData> => {
    // Vérifier le cache d'abord (sauf si forceRefresh)
    if (!forceRefresh) {
      const cachedData = getCachedMetrics();
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const yesterdayEnd = new Date(todayStart);

      // Récupération des activités du jour (créations et modifications)
      // On combine plusieurs tables pour avoir une vue globale de l'activité

      // Activité sur les produits
      const { data: productsToday } = await supabase
        .from('products')
        .select('id, created_at, updated_at')
        .or(
          `created_at.gte.${todayStart.toISOString()},updated_at.gte.${todayStart.toISOString()}`
        );

      const { data: productsYesterday } = await supabase
        .from('products')
        .select('id')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString());

      // Activité sur les collections
      const { data: collectionsToday } = await supabase
        .from('collections')
        .select('id, created_at, updated_at')
        .or(
          `created_at.gte.${todayStart.toISOString()},updated_at.gte.${todayStart.toISOString()}`
        );

      // Activité sur les utilisateurs (nouvelles inscriptions)
      const { data: usersToday } = await supabase
        .from('user_profiles')
        .select('user_id, created_at')
        .gte('created_at', todayStart.toISOString());

      // Calcul des métriques
      const todayActivity =
        (productsToday?.length || 0) +
        (collectionsToday?.length || 0) +
        (usersToday?.length || 0);

      const yesterdayActivity = productsYesterday?.length || 0;

      const trend =
        yesterdayActivity > 0
          ? ((todayActivity - yesterdayActivity) / yesterdayActivity) * 100
          : todayActivity > 0
            ? 100
            : 0;

      // Construction des actions récentes
      const recentActions: RecentAction[] = [];

      // Ajout des produits créés/modifiés
      productsToday?.slice(0, 3).forEach(p => {
        if (!p.created_at) return;
        const isNew = new Date(p.created_at) >= todayStart;
        recentActions.push({
          type: isNew ? 'product_created' : 'product_updated',
          description: isNew ? 'Nouveau produit ajouté' : 'Produit mis à jour',
          timestamp: isNew ? p.created_at : (p.updated_at ?? p.created_at),
        });
      });

      // Ajout des collections créées/modifiées
      collectionsToday?.slice(0, 2).forEach(c => {
        if (!c.created_at) return;
        const isNew = new Date(c.created_at) >= todayStart;
        recentActions.push({
          type: isNew ? 'collection_created' : 'collection_updated',
          description: isNew
            ? 'Nouvelle collection créée'
            : 'Collection mise à jour',
          timestamp: isNew ? c.created_at : (c.updated_at ?? c.created_at),
        });
      });

      // Ajout des nouveaux utilisateurs
      usersToday?.slice(0, 2).forEach(u => {
        if (!u.created_at) return;
        recentActions.push({
          type: 'user_registered',
          description: 'Nouvel utilisateur inscrit',
          timestamp: u.created_at,
        });
      });

      // Tri par timestamp décroissant (plus récent en premier)
      recentActions.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const result: ActivityMetricsData = {
        today: todayActivity,
        yesterday: yesterdayActivity,
        trend: Math.round(trend * 10) / 10,
        recentActions: recentActions.slice(0, 10), // Limite à 10 actions
      };

      // Mettre en cache le résultat
      setCachedMetrics(result);

      return result;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des métriques d'activité:",
        error
      );
      return {
        today: 0,
        yesterday: 0,
        trend: 0,
        recentActions: [],
      };
    }
  };

  // forceRefresh permet d'invalider le cache
  const forceRefresh = async (): Promise<ActivityMetricsData> => {
    return fetch(true);
  };

  return { fetch, forceRefresh };
}
