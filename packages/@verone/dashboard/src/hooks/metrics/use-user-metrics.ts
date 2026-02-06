/**
 * Hook pour les métriques utilisateurs
 * Récupère les statistiques sur les utilisateurs et leurs rôles
 */

'use client';

import { useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export function useUserMetrics() {
  // ✅ FIX: Use singleton client via useMemo
  const supabase = useMemo(() => createClient(), []);

  const fetch = async () => {
    try {
      // Récupération de tous les profils utilisateurs
      // TODO: Fix after role column removal - need to join with user_app_roles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, created_at, last_sign_in_at');

      if (profilesError) throw profilesError;

      // Récupération des utilisateurs créés dans les 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newUsers =
        profiles?.filter(
          p => p.created_at && new Date(p.created_at) > sevenDaysAgo
        ).length || 0;

      // Récupération des utilisateurs actifs (connectés dans les 30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers =
        profiles?.filter(p => {
          try {
            return (
              p.last_sign_in_at && new Date(p.last_sign_in_at) > thirtyDaysAgo
            );
          } catch {
            return false;
          }
        }).length || 0;

      // TODO: Restore role-based metrics by querying user_app_roles table
      const byRole = {
        admin: 0,
        catalog_manager: 0,
        sales: 0,
        partner_manager: 0,
      };

      // Calcul de la tendance (nouveaux utilisateurs sur 7 jours)
      const trend =
        profiles && profiles.length > 0
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
      console.error(
        'Erreur lors de la récupération des métriques utilisateurs:',
        error
      );
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
