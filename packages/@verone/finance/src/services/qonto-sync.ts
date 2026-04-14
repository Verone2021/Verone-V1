/**
 * Service de synchronisation Qonto
 *
 * Fonctionnalités:
 * - Sync manuelle des transactions (bouton UI)
 * - Pagination automatique
 * - Mécanisme anti-boucle via sync_runs et locks
 * - Sync incrémentale (depuis dernière sync)
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { QontoTransaction } from '@verone/integrations/qonto';
import { QontoClient } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

export type { QontoTransaction } from '@verone/integrations/qonto';
export type { QontoTransactionSide } from '@verone/integrations/qonto';

export type {
  SyncType,
  SyncRunStatus,
  SyncResult,
  SyncError,
  SyncOptions,
  SyncProgress,
  LastSyncStatus,
  TransactionDbData,
} from './qonto-sync-types';

import {
  type SyncType,
  type SyncRunStatus,
  type SyncResult,
  type SyncError,
  type SyncOptions,
  type LastSyncStatus,
  type TransactionDbData,
  extractErrorMessage,
} from './qonto-sync-types';

// =====================================================================
// SERVICE CLASS
// =====================================================================

export class QontoSyncService {
  private supabase = createAdminClient();
  private qontoClient: QontoClient;

  constructor(qontoClient?: QontoClient) {
    if (qontoClient) {
      this.qontoClient = qontoClient;
    } else {
      this.qontoClient = new QontoClient({
        authMode:
          (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') || 'oauth',
        organizationId: process.env.QONTO_ORGANIZATION_ID,
        apiKey: process.env.QONTO_API_KEY,
        accessToken: process.env.QONTO_ACCESS_TOKEN,
      });
    }
  }

  /**
   * Vérifie l'état de la dernière sync
   */
  async getLastSyncStatus(syncType: SyncType): Promise<LastSyncStatus> {
    const { data, error } = (await (this.supabase.rpc as CallableFunction)(
      'get_last_sync_status',
      { p_sync_type: syncType }
    )) as {
      data: Array<Record<string, unknown>> | null;
      error: { message: string } | null;
    };

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return {
        syncRunId: null,
        status: null,
        startedAt: null,
        completedAt: null,
        itemsFetched: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        durationMs: 0,
        hasActiveLock: false,
      };
    }

    const row = data[0];
    return {
      syncRunId: row.sync_run_id as string | null,
      status: row.status as SyncRunStatus | null,
      startedAt: row.started_at as string | null,
      completedAt: row.completed_at as string | null,
      itemsFetched: (row.items_fetched as number) || 0,
      itemsCreated: (row.items_created as number) || 0,
      itemsUpdated: (row.items_updated as number) || 0,
      durationMs: (row.duration_ms as number) || 0,
      hasActiveLock: (row.has_active_lock as boolean) || false,
    };
  }

  /**
   * Sync manuelle des transactions Qonto → Database
   */
  async syncTransactions(options: SyncOptions = {}): Promise<SyncResult> {
    const {
      since,
      fullSync = false,
      syncScope = 'incremental',
      fromDate = '2022-01-01',
      maxPages = syncScope === 'all' ? 1000 : 50,
      pageSize = 100,
      timeoutSeconds = syncScope === 'all' ? 900 : 300,
      autoCreateExpenses = true,
      onProgress,
    } = options;

    console.warn(
      `[Qonto Sync] Starting sync: scope=${syncScope}, fromDate=${fromDate}, maxPages=${maxPages}`
    );

    const errors: SyncError[] = [];
    let syncRunId: string = '';
    let lockToken: string = '';
    const startTime = Date.now();

    try {
      // 1. Acquérir le lock (anti-boucle)
      const lockResult = (await (this.supabase.rpc as CallableFunction)(
        'acquire_sync_lock',
        {
          p_sync_type: 'transactions',
          p_lock_duration_seconds: timeoutSeconds,
        }
      )) as {
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      };

      if (lockResult.error) {
        throw new Error(`Erreur acquisition lock: ${lockResult.error.message}`);
      }

      const lockData = lockResult.data?.[0];
      if (!lockData?.success) {
        return {
          success: false,
          syncRunId: (lockData?.sync_run_id as string) || '',
          status: 'cancelled',
          itemsFetched: 0,
          itemsCreated: 0,
          itemsUpdated: 0,
          itemsSkipped: 0,
          itemsFailed: 0,
          durationMs: Date.now() - startTime,
          errors: [],
          message: (lockData?.message as string) || 'Sync déjà en cours',
        };
      }

      syncRunId = lockData.sync_run_id as string;
      lockToken = lockData.lock_token as string;

      // 2. Déterminer la date de début selon le mode
      let syncFrom: Date | null = null;

      if (syncScope === 'all') {
        syncFrom = new Date(fromDate);
        console.warn(`[Qonto Sync] Backfill mode: syncing from ${fromDate}`);
      } else if (fullSync) {
        syncFrom = new Date('2020-01-01');
      } else if (since) {
        syncFrom = since;
      } else {
        const lastSync = await this.getLastSyncStatus('transactions');
        if (lastSync.completedAt) {
          syncFrom = new Date(lastSync.completedAt);
        } else {
          syncFrom = new Date();
          syncFrom.setDate(syncFrom.getDate() - 30);
        }
      }

      // 3. Récupérer les comptes bancaires
      const bankAccounts = await this.qontoClient.getBankAccounts();
      if (bankAccounts.length === 0) {
        throw new Error('Aucun compte bancaire trouvé');
      }

      // 4. Sync pagination - TOUS les comptes bancaires
      let cursor: string | undefined;
      let totalFetched = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;

      for (const account of bankAccounts) {
        let currentPage = 0;
        const accountStats = { fetched: 0, created: 0, updated: 0, skipped: 0 };

        do {
          onProgress?.({
            currentPage,
            totalItems: totalFetched,
            itemsProcessed: totalCreated + totalUpdated + totalSkipped,
            status: 'fetching',
          });

          const response = await this.qontoClient.getTransactions({
            bankAccountId: account.id,
            status: 'completed',
            ...(syncFrom ? { updatedAtFrom: syncFrom.toISOString() } : {}),
            perPage: pageSize,
            currentPage: currentPage + 1,
          });

          const transactions = response.transactions;
          totalFetched += transactions.length;
          accountStats.fetched += transactions.length;

          onProgress?.({
            currentPage,
            totalItems: totalFetched,
            itemsProcessed: totalCreated + totalUpdated + totalSkipped,
            status: 'processing',
          });

          for (const tx of transactions) {
            try {
              const result = await this.upsertTransaction(tx, account.id);
              if (result === 'created') {
                totalCreated++;
                accountStats.created++;
              } else if (result === 'updated') {
                totalUpdated++;
                accountStats.updated++;
              } else {
                totalSkipped++;
                accountStats.skipped++;
              }
            } catch (err) {
              totalFailed++;
              errors.push({
                transactionId: tx.transaction_id,
                code: 'UPSERT_ERROR',
                message: extractErrorMessage(err),
                timestamp: new Date().toISOString(),
              });
            }
          }

          currentPage++;

          if (transactions.length < pageSize) break;
          if (currentPage >= maxPages) break;
          if (Date.now() - startTime > timeoutSeconds * 1000) break;
          // eslint-disable-next-line no-constant-condition -- intentional infinite loop with break conditions above
        } while (true);

        console.warn(
          `[Qonto Sync] Account ${account.name} (${account.id.slice(0, 8)}...):`,
          `fetched=${accountStats.fetched},`,
          `created=${accountStats.created},`,
          `updated=${accountStats.updated},`,
          `skipped=${accountStats.skipped}`
        );

        if (Date.now() - startTime > timeoutSeconds * 1000) break;
      }

      // 5. Relâcher le lock avec succès
      const finalStatus: SyncRunStatus =
        totalFailed > 0 || errors.length > 0 ? 'partial' : 'completed';

      await (this.supabase.rpc as CallableFunction)('release_sync_lock', {
        p_sync_run_id: syncRunId,
        p_lock_token: lockToken,
        p_status: finalStatus,
        p_items_fetched: totalFetched,
        p_items_created: totalCreated,
        p_items_updated: totalUpdated,
        p_items_skipped: totalSkipped,
        p_items_failed: totalFailed,
        p_errors: JSON.stringify(errors),
        p_cursor: cursor ?? null,
      });

      // 6. Auto-créer les expenses pour les nouvelles transactions débit
      let expensesCreated = 0;
      if (autoCreateExpenses && (totalCreated > 0 || totalUpdated > 0)) {
        try {
          const { data } = (await (this.supabase.rpc as CallableFunction)(
            'create_expenses_from_debits'
          )) as { data: number | null };
          expensesCreated = data ?? 0;
        } catch (expenseErr) {
          console.error('[Qonto Sync] Error creating expenses:', expenseErr);
        }
      }

      return {
        success: true,
        syncRunId,
        status: finalStatus,
        itemsFetched: totalFetched,
        itemsCreated: totalCreated,
        itemsUpdated: totalUpdated,
        itemsSkipped: totalSkipped,
        itemsFailed: totalFailed,
        durationMs: Date.now() - startTime,
        errors,
        cursor,
        message:
          `Sync terminée: ${totalCreated} créées, ${totalUpdated} mises à jour, ${totalSkipped} ignorées` +
          (expensesCreated > 0 ? `, ${expensesCreated} expenses créées` : ''),
      };
    } catch (err) {
      if (syncRunId && lockToken) {
        await (this.supabase.rpc as CallableFunction)('release_sync_lock', {
          p_sync_run_id: syncRunId,
          p_lock_token: lockToken,
          p_status: 'failed',
          p_items_fetched: 0,
          p_items_created: 0,
          p_items_updated: 0,
          p_items_skipped: 0,
          p_items_failed: 0,
          p_errors: JSON.stringify([
            {
              code: 'SYNC_ERROR',
              message: extractErrorMessage(err),
              timestamp: new Date().toISOString(),
            },
          ]),
          p_cursor: null,
        });
      }

      const errMessage = extractErrorMessage(err);

      return {
        success: false,
        syncRunId,
        status: 'failed',
        itemsFetched: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        itemsFailed: 0,
        durationMs: Date.now() - startTime,
        errors: [
          {
            code: 'SYNC_ERROR',
            message: errMessage,
            timestamp: new Date().toISOString(),
          },
        ],
        message: errMessage,
      };
    }
  }

  /**
   * Insert ou update une transaction
   */
  private async upsertTransaction(
    tx: QontoTransaction,
    bankAccountId: string
  ): Promise<'created' | 'updated' | 'skipped'> {
    const { data: existing } = await this.supabase
      .from('bank_transactions')
      .select('id, updated_at')
      .eq('transaction_id', tx.transaction_id)
      .single();

    let vat_breakdown: TransactionDbData['vat_breakdown'] = null;
    if (tx.vat_details?.items && tx.vat_details.items.length > 0) {
      vat_breakdown = tx.vat_details.items.map((item, idx) => ({
        description: `Ligne ${idx + 1}`,
        amount_ht: 0,
        tva_rate: item.rate,
        tva_amount: item.amount_cents / 100,
      }));
    }

    const hasQontoVat =
      tx.vat_rate !== undefined && tx.vat_rate !== null && tx.vat_rate !== -1;

    const transactionData: TransactionDbData = {
      transaction_id: tx.transaction_id,
      bank_provider: 'qonto',
      bank_account_id: bankAccountId,
      amount: tx.amount,
      currency: tx.currency,
      side: tx.side,
      operation_type: tx.operation_type,
      label: tx.label,
      note: tx.note,
      reference: tx.reference,
      counterparty_name: tx.counterparty?.name,
      counterparty_iban: tx.counterparty?.iban,
      emitted_at: tx.emitted_at,
      settled_at: tx.settled_at ?? undefined,
      raw_data: tx as unknown as Record<string, unknown>,
      attachment_ids: tx.attachment_ids ?? null,
      updated_at: new Date().toISOString(),
      vat_rate: hasQontoVat ? tx.vat_rate : null,
      vat_source: hasQontoVat ? 'qonto_ocr' : null,
      vat_breakdown: hasQontoVat ? null : vat_breakdown,
    };

    if (existing) {
      const existingDate = new Date(existing.updated_at);
      const txDate = new Date(tx.updated_at || tx.emitted_at);

      if (txDate <= existingDate) {
        return 'skipped';
      }

      const { error } = await this.supabase
        .from('bank_transactions')
        .update(transactionData as never)
        .eq('id', existing.id);

      if (error) throw error;
      return 'updated';
    } else {
      const { error } = await this.supabase
        .from('bank_transactions')
        .insert(transactionData as never);

      if (error) throw error;
      return 'created';
    }
  }

  /**
   * Nettoyer les locks expirés
   */
  async cleanupExpiredLocks(): Promise<number> {
    const { data, error } = (await (this.supabase.rpc as CallableFunction)(
      'cleanup_expired_sync_locks'
    )) as { data: number | null; error: { message: string } | null };
    if (error) {
      console.error('Error cleaning up expired locks:', error);
      return 0;
    }
    return data ?? 0;
  }
}

// =====================================================================
// SINGLETON EXPORT
// =====================================================================

let syncServiceInstance: QontoSyncService | null = null;

export function getQontoSyncService(): QontoSyncService {
  syncServiceInstance ??= new QontoSyncService();
  return syncServiceInstance;
}
