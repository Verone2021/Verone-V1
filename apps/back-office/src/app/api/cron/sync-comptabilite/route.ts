/**
 * Cron Route: GET /api/cron/sync-comptabilite
 *
 * Synchronisation comptable nocturne (quotidienne). Tient la Bibliothèque à
 * jour sans intervention manuelle :
 *   1. Synchronise les nouvelles transactions Qonto (POST /api/qonto/sync).
 *   2. Rapatrie en local les pièces jointes Qonto pas encore stockées
 *      (année courante + précédente) via la lib partagée syncQontoAttachments.
 *
 * NE déclenche AUCUN envoi au comptable — uniquement récupération + classement.
 *
 * Sécurisé via header `Authorization: Bearer <CRON_SECRET>` (standard Vercel
 * Cron), comme /api/cron/meta-commerce-sync.
 *
 * Configuration vercel.json (bloc "crons") :
 *   { "path": "/api/cron/sync-comptabilite", "schedule": "0 5 * * *" }  // 5h, quotidien
 *
 * [BO-COMPTA-001]
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/admin';

import { syncQontoAttachments } from '../../finance/sync-qonto-attachments/_lib/sync-attachments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CronResult {
  success: boolean;
  transactionsSync?: unknown;
  attachments?: { year: number; downloaded: number; failed: number }[];
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<CronResult>> {
  // 1. Sécurité : secret Vercel Cron
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    const origin = new URL(request.url).origin;

    // 2. Sync des transactions Qonto (incrémentale). Route sans auth user.
    //    Best-effort : si ça échoue, on continue quand même la récup des pièces.
    let transactionsSync: unknown = null;
    try {
      const resp = await fetch(`${origin}/api/qonto/sync?scope=incremental`, {
        method: 'POST',
      });
      transactionsSync = (await resp.json()) as unknown;
      if (!resp.ok) {
        console.error('[CRON compta] qonto/sync HTTP', resp.status);
      }
    } catch (err) {
      console.error('[CRON compta] qonto/sync failed:', err);
    }

    // 3. Rapatriement des pièces Qonto manquantes (année courante + précédente)
    const admin = createAdminClient();
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1];
    const attachments: { year: number; downloaded: number; failed: number }[] =
      [];

    for (const year of years) {
      const res = await syncQontoAttachments(admin, { year });
      attachments.push({
        year,
        downloaded: res.downloaded,
        failed: res.failed,
      });
      console.warn(
        `[CRON compta] ${year}: ${res.downloaded} pièces rapatriées, ${res.failed} échecs`
      );
    }

    return NextResponse.json({ success: true, transactionsSync, attachments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[CRON compta] sync-comptabilite failed:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
