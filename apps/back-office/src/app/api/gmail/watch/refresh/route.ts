/**
 * API Route CRON: renouvellement automatique du watch Gmail (BO-MSG-011)
 *
 * GET /api/gmail/watch/refresh
 *
 * Le watch Gmail (users.watch) expire après 7 jours. Sans renouvellement, le
 * pipeline Pub/Sub s'arrête → plus de mails entrants. Cette route renouvelle
 * automatiquement le watch pour toutes les adresses dans gmail_watch_state
 * dont la date d'expiration approche (< 24h).
 *
 * Déclenché par Vercel Cron (cf. vercel.json) tous les jours à 06:00 UTC.
 *
 * Sécurité : authentification via Bearer CRON_SECRET (variable Vercel).
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { startWatch } from '@verone/integrations/gmail';

import { createAdminClient } from '@verone/utils/supabase/admin';

const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Auth via CRON_SECRET (Vercel Cron envoie automatiquement ce header)
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error('[Gmail Watch Refresh] CRON_SECRET manquant');
    return NextResponse.json(
      { error: 'Configuration serveur incomplete' },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  // 2. Topic Pub/Sub
  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName) {
    return NextResponse.json(
      { error: 'GMAIL_PUBSUB_TOPIC manquant', code: 'MISSING_TOPIC' },
      { status: 500 }
    );
  }

  // 3. Lister les watches existants
  const supabase = createAdminClient();
  const { data: watches, error: fetchError } = await supabase
    .from('gmail_watch_state')
    .select('email_address, last_history_id, watch_expires_at');

  if (fetchError) {
    console.error('[Gmail Watch Refresh] fetch failed:', fetchError);
    return NextResponse.json(
      { error: fetchError.message, code: 'FETCH_FAILED' },
      { status: 500 }
    );
  }

  const now = Date.now();
  const renewals: Array<{
    email: string;
    status: 'renewed' | 'skipped' | 'failed';
    detail?: string;
  }> = [];

  // 4. Renouveler ceux qui expirent bientot (ou n'ont pas de date)
  for (const w of watches ?? []) {
    const expiresAt = w.watch_expires_at
      ? new Date(w.watch_expires_at).getTime()
      : 0;
    const needsRefresh = expiresAt - now < REFRESH_THRESHOLD_MS;

    if (!needsRefresh) {
      renewals.push({ email: w.email_address, status: 'skipped' });
      continue;
    }

    try {
      const result = await startWatch(w.email_address, topicName);
      const { error: upsertError } = await supabase
        .from('gmail_watch_state')
        .upsert(
          {
            email_address: result.emailAddress.toLowerCase(),
            last_history_id: result.historyId,
            watch_expires_at: result.expirationDate,
          },
          { onConflict: 'email_address' }
        );
      if (upsertError) {
        renewals.push({
          email: w.email_address,
          status: 'failed',
          detail: `upsert: ${upsertError.message}`,
        });
        continue;
      }
      renewals.push({ email: w.email_address, status: 'renewed' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `[Gmail Watch Refresh] watch failed for ${w.email_address}:`,
        e
      );
      renewals.push({
        email: w.email_address,
        status: 'failed',
        detail: msg,
      });
    }
  }

  const summary = {
    total: renewals.length,
    renewed: renewals.filter(r => r.status === 'renewed').length,
    skipped: renewals.filter(r => r.status === 'skipped').length,
    failed: renewals.filter(r => r.status === 'failed').length,
  };

  // Si toutes les renouvellements ratent → 500 pour alerter via Vercel Cron logs
  const allFailed =
    summary.failed > 0 && summary.failed === summary.total - summary.skipped;
  const status = allFailed ? 500 : 200;

  return NextResponse.json(
    {
      ok: !allFailed,
      summary,
      renewals,
    },
    { status }
  );
}
