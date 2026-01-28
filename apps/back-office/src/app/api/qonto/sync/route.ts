/**
 * API Route: POST /api/qonto/sync
 * Synchronise les transactions Qonto vers la base de données
 *
 * Query params:
 * - scope=all : Backfill complet depuis fromDate (défaut: 2022-01-01)
 * - scope=incremental : Sync depuis dernière sync (défaut)
 * - from=YYYY-MM-DD : Date de début pour scope=all
 * - fullSync=true : (legacy) Équivalent à scope=all
 * - since=YYYY-MM-DD : Sync depuis une date spécifique
 *
 * Examples:
 * - POST /api/qonto/sync?scope=all&from=2022-01-01  → Backfill complet
 * - POST /api/qonto/sync?scope=incremental         → Sync incrémentale
 * - POST /api/qonto/sync                           → Sync incrémentale par défaut
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getQontoSyncService } from '@verone/finance/services';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Nouveaux paramètres
    const scope = searchParams.get('scope') as 'all' | 'incremental' | null;
    const fromDate = searchParams.get('from') || '2022-01-01';

    // Legacy params (rétro-compatibilité)
    const fullSync = searchParams.get('fullSync') === 'true';
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : undefined;

    // Déterminer le scope effectif
    const syncScope: 'all' | 'incremental' =
      scope === 'all' || fullSync ? 'all' : 'incremental';

    console.warn(
      `[API Qonto Sync] Request: scope=${syncScope}, from=${fromDate}`
    );

    const syncService = getQontoSyncService();

    // Lancer la sync des transactions
    const result = await syncService.syncTransactions({
      syncScope,
      fromDate,
      fullSync,
      since,
      // Le service gère les valeurs par défaut selon syncScope
      autoCreateExpenses: true,
    });

    return NextResponse.json({
      success: result.success,
      syncRunId: result.syncRunId,
      status: result.status,
      syncScope,
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
