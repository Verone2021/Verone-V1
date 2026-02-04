/**
 * 📊 API Analytics Batch - Vérone
 * Endpoint pour enregistrer événements en batch (optimisation performance)
 * Utilisé pour flush événements accumulés
 * ✅ RGPD Compliant: IP anonymisée, UA simplifié
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { Json } from '@verone/types/supabase';
import { anonymizeIP, simplifyUserAgent } from '@verone/utils/analytics';
import { createClient } from '@verone/utils/supabase/server';

// Node.js runtime
export const dynamic = 'force-dynamic';
interface ActivityEvent {
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: {
    page_url?: string;
    user_agent?: string;
    ip_address?: string;
    session_duration?: number;
    [key: string]: unknown;
  };
}

interface BatchRequest {
  events: ActivityEvent[];
  session_id: string;
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

    // Parser batch request
    const { events, session_id } = (await request.json()) as BatchRequest;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Aucun événement fourni' },
        { status: 400 }
      );
    }

    // Limiter taille batch (protection DoS)
    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Batch trop volumineux (max 100 événements)' },
        { status: 400 }
      );
    }

    // Récupérer user_profile pour organisation_id
    const { data: profile } = (await supabase
      .from('user_profiles')
      .select('organisation_id')
      .eq('user_id', user.id)
      .single()) as { data: { organisation_id: string | null } | null };

    // Récupérer IP et User Agent bruts une seule fois
    const rawIP =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip');
    const rawUA = request.headers.get('user-agent');

    // Préparer données pour insertion batch avec anonymisation RGPD
    const activityLogs = events.map(event => ({
      user_id: user.id,
      organisation_id: profile?.organisation_id ?? null,
      action: event.action,
      table_name: event.table_name ?? null,
      record_id: event.record_id ?? null,
      old_data: (event.old_data ?? null) as Json,
      new_data: (event.new_data ?? null) as Json,
      severity: event.severity ?? 'info',
      metadata: (event.metadata ?? {}) as Json,
      session_id: session_id,
      page_url: event.metadata?.page_url ?? null,
      user_agent: simplifyUserAgent(event.metadata?.user_agent ?? rawUA), // ✅ Anonymisé production
      ip_address: anonymizeIP(rawIP), // ✅ Anonymisée production
    }));

    // Insertion batch
    const { error: insertError, count } = await supabase
      .from('user_activity_logs')
      .insert(activityLogs);

    if (insertError) {
      console.error('[Analytics Batch] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Erreur enregistrement batch' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${events.length} événements enregistrés`,
        count: count ?? events.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Analytics Batch] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
