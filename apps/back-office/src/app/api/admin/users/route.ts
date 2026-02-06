/**
 * 📊 API Admin - Liste Utilisateurs avec Métriques Activité
 * GET /api/admin/users
 *
 * Retourne tous les utilisateurs avec leurs stats d'activité pour dashboard admin
 */

import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

// Node runtime requis pour cookies() async
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UserActivityStats {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  total_sessions: number;
  total_actions: number;
  last_activity: string | null;
  engagement_score: number;
  most_used_module: string | null;
  is_active_now: boolean;
}

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Vérifier authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier rôle owner
    const { data: userRole, error: roleError } = await supabase
      .from('user_app_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('app', 'back-office')
      .eq('is_active', true)
      .single();

    if (roleError || userRole?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Accès refusé - Owner uniquement' },
        { status: 403 }
      );
    }

    // Récupérer tous les utilisateurs back-office avec leurs rôles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(
        `
        user_id,
        first_name,
        last_name
      `
      )
      .order('last_name');

    if (profilesError) {
      throw profilesError;
    }

    // Pour chaque profil, récupérer l'email, le rôle et les stats d'activité
    const usersWithStats = await Promise.all(
      (profiles ?? []).map(async profile => {
        // Récupérer email depuis auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(
          profile.user_id
        );

        // Récupérer rôle depuis user_app_roles
        const { data: userRole } = await supabase
          .from('user_app_roles')
          .select('role')
          .eq('user_id', profile.user_id)
          .eq('app', 'back-office')
          .eq('is_active', true)
          .single();

        // Stats d'activité via fonction SQL
        const { data: stats } = await supabase.rpc('get_user_activity_stats', {
          p_user_id: profile.user_id,
          p_days: 30,
        });

        const userStats = stats?.[0] ?? {
          total_sessions: 0,
          total_actions: 0,
          avg_session_duration: null,
          most_used_module: null,
          engagement_score: 0,
          last_activity: null,
        };

        // Vérifier si session active (activité < 30 min)
        let isActiveNow = false;
        if (userStats.last_activity) {
          const lastActivity = new Date(userStats.last_activity);
          const now = new Date();
          const diffMinutes =
            (now.getTime() - lastActivity.getTime()) / (1000 * 60);
          isActiveNow = diffMinutes < 30;
        }

        const fullName =
          [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
          null;

        return {
          user_id: profile.user_id,
          email: authUser?.user?.email ?? "Pas d'email",
          full_name: fullName,
          role: userRole?.role ?? 'unknown',
          total_sessions: userStats.total_sessions ?? 0,
          total_actions: userStats.total_actions ?? 0,
          last_activity: userStats.last_activity,
          engagement_score: userStats.engagement_score ?? 0,
          most_used_module: userStats.most_used_module,
          is_active_now: isActiveNow,
        } as UserActivityStats;
      })
    );

    // Trier par engagement score décroissant
    usersWithStats.sort((a, b) => b.engagement_score - a.engagement_score);

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      total: usersWithStats.length,
    });
  } catch (error) {
    console.error('Erreur API admin users:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
