/**
 * Hook pour les métriques d'activité
 * Trace l'activité récente et les tendances
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

interface RecentAction {
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export function useActivityMetrics() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetch = async () => {
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
        .or(`created_at.gte.${todayStart.toISOString()},updated_at.gte.${todayStart.toISOString()}`);

      const { data: productsYesterday } = await supabase
        .from('products')
        .select('id')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString());

      // Activité sur les collections
      const { data: collectionsToday } = await supabase
        .from('collections')
        .select('id, created_at, updated_at')
        .or(`created_at.gte.${todayStart.toISOString()},updated_at.gte.${todayStart.toISOString()}`);

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

      const trend = yesterdayActivity > 0
        ? ((todayActivity - yesterdayActivity) / yesterdayActivity) * 100
        : todayActivity > 0 ? 100 : 0;

      // Construction des actions récentes
      const recentActions: RecentAction[] = [];

      // Ajout des produits créés/modifiés
      productsToday?.slice(0, 3).forEach(p => {
        const isNew = new Date(p.created_at) >= todayStart;
        recentActions.push({
          type: isNew ? 'product_created' : 'product_updated',
          description: isNew ? 'Nouveau produit ajouté' : 'Produit mis à jour',
          timestamp: isNew ? p.created_at : p.updated_at,
        });
      });

      // Ajout des collections créées/modifiées
      collectionsToday?.slice(0, 2).forEach(c => {
        const isNew = new Date(c.created_at) >= todayStart;
        recentActions.push({
          type: isNew ? 'collection_created' : 'collection_updated',
          description: isNew ? 'Nouvelle collection créée' : 'Collection mise à jour',
          timestamp: isNew ? c.created_at : c.updated_at,
        });
      });

      // Ajout des nouveaux utilisateurs
      usersToday?.slice(0, 2).forEach(u => {
        recentActions.push({
          type: 'user_registered',
          description: 'Nouvel utilisateur inscrit',
          timestamp: u.created_at,
        });
      });

      // Tri par timestamp décroissant (plus récent en premier)
      recentActions.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return {
        today: todayActivity,
        yesterday: yesterdayActivity,
        trend: Math.round(trend * 10) / 10,
        recentActions: recentActions.slice(0, 10), // Limite à 10 actions
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques d\'activité:', error);
      return {
        today: 0,
        yesterday: 0,
        trend: 0,
        recentActions: [],
      };
    }
  };

  return { fetch };
}