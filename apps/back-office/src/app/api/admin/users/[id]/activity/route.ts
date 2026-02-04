/**
 * 📊 API Admin User Activity - Vérone
 * Endpoint pour récupérer historique activité utilisateur
 * Accessible uniquement par owners
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

// Node runtime requis pour cookies() async
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface UserProfile {
  role: string;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerClient();

    // Vérifier authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier rôle owner
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .returns<UserProfile>();

    if (profile?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Accès réservé aux propriétaires' },
        { status: 403 }
      );
    }

    // Récupérer params
    const { id: targetUserId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const days = parseInt(searchParams.get('days') ?? '30');

    // Récupérer activité récente via fonction SQL (RPC exists in generated types)
    const { data: recentActions, error: actionsError } = await supabase.rpc(
      'get_user_recent_actions',
      {
        p_user_id: targetUserId,
        p_limit: limit,
      }
    );

    if (actionsError) {
      console.error('[Admin Activity] Actions error:', actionsError);
    }

    // Récupérer statistiques via fonction SQL (RPC exists in generated types)
    const { data: stats, error: statsError } = await supabase.rpc(
      'get_user_activity_stats',
      {
        p_user_id: targetUserId,
        p_days: days,
      }
    );

    if (statsError) {
      console.error('[Admin Activity] Stats error:', statsError);
    }

    // Récupérer sessions actives
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', targetUserId)
      .is('session_end', null)
      .order('last_activity', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('[Admin Activity] Sessions error:', sessionsError);
    }

    return NextResponse.json(
      {
        recent_actions: recentActions ?? [],
        statistics: stats?.[0] ?? {
          total_sessions: 0,
          total_actions: 0,
          avg_session_duration: null,
          most_used_module: null,
          engagement_score: 0,
          last_activity: null,
        },
        active_sessions: activeSessions ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Activity] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
