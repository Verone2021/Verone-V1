/**
 * Hook pour les métriques utilisateurs
 * Récupère les statistiques sur les utilisateurs et leurs rôles
 */

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useUserMetrics() {
  const supabase = createClientComponentClient();

  const fetch = async () => {
    try {
      // Récupération de tous les profils utilisateurs
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, role, created_at, last_sign_in_at');

      if (profilesError) throw profilesError;

      // Récupération des utilisateurs créés dans les 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newUsers = profiles?.filter(p =>
        new Date(p.created_at) > sevenDaysAgo
      ).length || 0;

      // Récupération des utilisateurs actifs (connectés dans les 30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = profiles?.filter(p =>
        p.last_sign_in_at && new Date(p.last_sign_in_at) > thirtyDaysAgo
      ).length || 0;

      // Comptage par rôle
      const byRole = {
        admin: profiles?.filter(p => p.role === 'admin').length || 0,
        catalog_manager: profiles?.filter(p => p.role === 'catalog_manager').length || 0,
        sales: profiles?.filter(p => p.role === 'sales').length || 0,
        partner_manager: profiles?.filter(p => p.role === 'partner_manager').length || 0,
      };

      // Calcul de la tendance (nouveaux utilisateurs sur 7 jours)
      const trend = profiles && profiles.length > 0
        ? (newUsers / profiles.length) * 100
        : 0;

      return {
        total: profiles?.length || 0,
        active: activeUsers,
        new: newUsers,
        byRole,
        trend: Math.round(trend * 10) / 10,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques utilisateurs:', error);
      return {
        total: 0,
        active: 0,
        new: 0,
        byRole: {
          admin: 0,
          catalog_manager: 0,
          sales: 0,
          partner_manager: 0,
        },
        trend: 0,
      };
    }
  };

  return { fetch };
}