/**
 * Cron Route: GET /api/cron/meta-commerce-sync
 *
 * Cron Vercel — équivalent du cron Google Merchant
 * (`/api/cron/google-merchant-poll`). Appelle la route interne
 * `POST /api/meta-commerce/sync-statuses` qui fetch Meta Graph API
 * et met à jour `meta_commerce_syncs.meta_status`.
 *
 * Sécurisé via header `Authorization: Bearer <CRON_SECRET>` (standard
 * Vercel Cron). Si l'env var `CRON_SECRET` est manquante, la route
 * accepte les appels — utile en dev mais ne devrait pas arriver en prod.
 *
 * Configuration `vercel.json` à ajouter (manuel) :
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/meta-commerce-sync",
 *       "schedule": "0 *\/2 * * *"
 *     }
 *   ]
 * }
 * (toutes les 2h, ajustable selon volume)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface CronResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<CronResponse>> {
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
    // Appel interne à la route sync-statuses. URL dérivée du request pour
    // marcher en dev (localhost) comme en prod (vercel preview/production).
    const baseUrl = new URL(request.url).origin;
    const syncUrl = `${baseUrl}/api/meta-commerce/sync-statuses`;

    console.warn('[CRON] Triggering Meta sync-statuses...');

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies pour préserver l'auth Supabase éventuelle
        cookie: request.headers.get('cookie') ?? '',
      },
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      console.error('[CRON] sync-statuses returned error:', data);
      return NextResponse.json(
        {
          success: false,
          error: `sync-statuses HTTP ${response.status}`,
          data,
        },
        { status: response.status }
      );
    }

    console.warn('[CRON] Meta sync-statuses done');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[CRON] meta-commerce-sync failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
