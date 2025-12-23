/**
 * API Route: POST /api/qonto/sync
 * Synchronise les transactions Qonto vers la base de données
 *
 * Query params:
 * - fullSync=true : Sync complète depuis 2020
 * - since=YYYY-MM-DD : Sync depuis une date spécifique
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getQontoSyncService } from '@verone/finance/services';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fullSync = searchParams.get('fullSync') === 'true';
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : undefined;

    const syncService = getQontoSyncService();

    // Lancer la sync des transactions
    const result = await syncService.syncTransactions({
      fullSync,
      since,
      maxPages: fullSync ? 100 : 10, // Plus de pages pour full sync
      pageSize: 100,
      timeoutSeconds: fullSync ? 300 : 120,
    });

    return NextResponse.json({
      success: result.success,
      syncRunId: result.syncRunId,
      status: result.status,
      itemsFetched: result.itemsFetched,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      itemsSkipped: result.itemsSkipped,
      itemsFailed: result.itemsFailed,
      durationMs: result.durationMs,
      message: result.message,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('[Qonto Sync] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Erreur de synchronisation',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const syncService = getQontoSyncService();
    const lastSync = await syncService.getLastSyncStatus('transactions');

    return NextResponse.json({
      lastSync,
    });
  } catch (error) {
    console.error('[Qonto Sync] Error getting status:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
