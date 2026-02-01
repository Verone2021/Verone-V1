/**
 * 📊 API Analytics Events - Vérone
 * Endpoint pour enregistrer événements activité utilisateur
 * Utilisé par use-user-activity-tracker hook
 * ✅ RGPD Compliant: IP anonymisée, UA simplifié
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { anonymizeIP, simplifyUserAgent } from '@verone/utils/analytics';
import { createClient } from '@verone/utils/supabase/server';

// Node.js runtime
export const dynamic = 'force-dynamic';

interface ActivityEvent {
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: {
    page_url?: string;
    user_agent?: string;
    ip_address?: string;
    session_duration?: number;
    click_position?: { x: number; y: number };
    element_target?: string;
    search_query?: string;
    filter_applied?: Record<string, any>;
    performance_metrics?: {
      load_time?: number;
      interaction_time?: number;
      error_count?: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Vérifier authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser événement
    const event: ActivityEvent = await request.json();

    // Récupérer user_profile pour organisation_id
    const { data: profile } = (await supabase
      .from('user_profiles')
      .select('organisation_id')
      .eq('user_id', user.id)
      .single()) as { data: { organisation_id: string | null } | null };

    // Récupérer IP et User Agent bruts
    const rawIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip');
    const rawUA =
      event.metadata?.user_agent || request.headers.get('user-agent');

    // Préparer données log avec anonymisation RGPD
    const activityLog = {
      user_id: user.id,
      organisation_id: profile?.organisation_id ?? null,
      action: event.action,
      table_name: event.table_name ?? null,
      record_id: event.record_id ?? null,
      old_data: event.old_data ?? null,
      new_data: event.new_data ?? null,
      severity: event.severity ?? 'info',
      metadata: event.metadata ?? {},
      session_id: event.metadata?.session_duration?.toString() ?? null, // Utiliser comme proxy session
      page_url:
        (event.metadata?.page_url || request.headers.get('referer')) ?? null,
      user_agent: simplifyUserAgent(rawUA), // ✅ Anonymisé production
      ip_address: anonymizeIP(rawIP), // ✅ Anonymisée production
    };

    // Insérer dans audit_logs (sera renommé user_activity_logs par migration)
    const { error: insertError } = await supabase
      .from('user_activity_logs')
      .insert(activityLog);

    if (insertError) {
      console.error('[Analytics API] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Erreur enregistrement événement' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Événement enregistré' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
