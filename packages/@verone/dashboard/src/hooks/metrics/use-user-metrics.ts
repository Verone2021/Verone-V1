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
      // Récupération de tous les utilisateurs back-office
      const { data: backofficeRoles, error: rolesError } = await supabase
        .from('user_app_roles')
        .select('user_id, role, created_at')
        .eq('app', 'back-office')
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      // Récupérer les profils pour avoir last_sign_in_at
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, last_sign_in_at')
        .in(
          'user_id',
          (backofficeRoles ?? []).map(r => r.user_id)
        );

      // Mapper les données
      const usersData = (backofficeRoles ?? []).map(role => {
        const profile = profiles?.find(p => p.user_id === role.user_id);
        return {
          user_id: role.user_id,
          role: role.role,
          created_at: role.created_at,
          last_sign_in_at: profile?.last_sign_in_at,
        };
      });

      // Récupération des utilisateurs créés dans les 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newUsers =
        usersData.filter(
          p => p.created_at && new Date(p.created_at) > sevenDaysAgo
        ).length || 0;

      // Récupération des utilisateurs actifs (connectés dans les 30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers =
        usersData.filter(p => {
          try {
            return (
              p.last_sign_in_at && new Date(p.last_sign_in_at) > thirtyDaysAgo
            );
          } catch {
            return false;
          }
        }).length || 0;

      // Comptage par rôle (uniquement owner et admin)
      const byRole = {
        admin: usersData.filter(p => p.role === 'admin').length || 0,
        owner: usersData.filter(p => p.role === 'owner').length || 0,
      };

      // Calcul de la tendance (nouveaux utilisateurs sur 7 jours)
      const trend =
        usersData && usersData.length > 0
          ? (newUsers / usersData.length) * 100
          : 0;

      return {
        total: usersData.length || 0,
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
          owner: 0,
        },
        trend: 0,
      };
    }
  };

  return { fetch };
}
