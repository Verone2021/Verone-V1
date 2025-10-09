// =====================================================================
// Route API Cron: GET /api/cron/cleanup-abby-data
// Date: 2025-10-11
// Description: Cron job quotidien cleanup données Abby anciennes
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cleanupOldSyncOperations } from '@/lib/abby/sync-processor';

// =====================================================================
// GET /api/cron/cleanup-abby-data
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
    console.log(
      `[CRON] Cleanup Abby Data started at ${new Date().toISOString()}`
    );

    const supabase = await createClient();
    const results = {
      syncOperations: 0,
      webhookEvents: 0,
      statusHistory: 0,
    };

    // 3. Cleanup sync operations (>30 jours)
    try {
      results.syncOperations = await cleanupOldSyncOperations();
    } catch (error) {
      console.error('Failed to cleanup sync operations:', error);
    }

    // 4. Cleanup webhook events (>7 jours via expires_at)
    try {
      const { data: webhookCleanup, error: webhookError } = await supabase.rpc(
        'cleanup_expired_webhook_events'
      );

      if (webhookError) throw webhookError;
      results.webhookEvents = webhookCleanup as number;
    } catch (error) {
      console.error('Failed to cleanup webhook events:', error);
    }

    // 5. Cleanup invoice status history (>1 an)
    try {
      const { data: historyCleanup, error: historyError } = await supabase.rpc(
        'cleanup_old_status_history'
      );

      if (historyError) throw historyError;
      results.statusHistory = historyCleanup as number;
    } catch (error) {
      console.error('Failed to cleanup status history:', error);
    }

    // 6. Log résultats
    console.log(`[CRON] Cleanup Abby Data completed:`, results);

    // 7. Response
    return NextResponse.json(
      {
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          syncOperations: results.syncOperations,
          webhookEvents: results.webhookEvents,
          statusHistory: results.statusHistory,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CRON] Cleanup Abby Data failed:', error);

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
export const runtime = 'nodejs';
