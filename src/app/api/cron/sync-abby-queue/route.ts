// =====================================================================
// Route API Cron: GET /api/cron/sync-abby-queue
// Date: 2025-10-11
// Description: Cron job pour traiter queue sync Abby
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { processSyncQueue } from '@/lib/abby/sync-processor';

// =====================================================================
// GET /api/cron/sync-abby-queue
// =====================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier Authorization header (cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured in environment');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Log démarrage cron
    console.log(`[CRON] Sync Abby Queue started at ${new Date().toISOString()}`);

    // 3. Exécuter sync processor
    const results = await processSyncQueue();

    // 4. Log résultats
    console.log(`[CRON] Sync Abby Queue completed:`, results);

    // 5. Response
    return NextResponse.json(
      {
        success: true,
        message: 'Sync queue processed successfully',
        data: {
          processed: results.processed,
          succeeded: results.succeeded,
          failed: results.failed,
          errors: results.errors,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CRON] Sync Abby Queue failed:', error);

    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =====================================================================
// METADATA ROUTE
// =====================================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Edge runtime non supporté pour cron complexe
