/**
 * Service de synchronisation Qonto
 *
 * Fonctionnalités:
 * - Sync manuelle des transactions (bouton UI)
 * - Pagination automatique
 * - Mécanisme anti-boucle via sync_runs et locks
 * - Sync incrémentale (depuis dernière sync)
 */

import type {
  QontoTransaction,
  QontoTransactionSide,
} from '@verone/integrations/qonto';
import { QontoClient } from '@verone/integrations/qonto';
import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export type SyncType =
  | 'transactions'
  | 'client_invoices'
  | 'attachments'
  | 'labels'
  | 'full';

export type SyncRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'cancelled';

export interface SyncResult {
  success: boolean;
  syncRunId: string;
  status: SyncRunStatus;
  itemsFetched: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  itemsFailed: number;
  durationMs: number;
  errors: SyncError[];
  cursor?: string;
  message: string;
}

export interface SyncError {
  transactionId?: string;
  code: string;
  message: string;
  timestamp: string;
}

export interface SyncOptions {
  /** Date de début pour la sync (défaut: 30 jours) */
  since?: Date;
  /** Sync complète depuis le début */
  fullSync?: boolean;
  /** Nombre max de pages à traiter */
  maxPages?: number;
  /** Nombre d'items par page (défaut: 100, max: 100) */
  pageSize?: number;
  /** Timeout en secondes (défaut: 300) */
  timeoutSeconds?: number;
  /** Callback progression */
  onProgress?: (progress: SyncProgress) => void;
}

export interface SyncProgress {
  currentPage: number;
  totalItems: number;
  itemsProcessed: number;
  status: 'fetching' | 'processing' | 'saving';
}

export interface LastSyncStatus {
  syncRunId: string | null;
  status: SyncRunStatus | null;
  startedAt: string | null;
  completedAt: string | null;
  itemsFetched: number;
  itemsCreated: number;
  itemsUpdated: number;
  durationMs: number;
  hasActiveLock: boolean;
}

// Type interne pour les données de transaction en DB
// Note: Supabase utilise undefined et non null pour les champs optionnels
interface TransactionDbData {
  transaction_id: string;
  bank_provider: 'qonto' | 'revolut';
  bank_account_id: string;
  amount: number;
  currency: string;
  side: QontoTransactionSide;
  // Champs optionnels avec undefined pour compatibilité Supabase
  amount_cents?: number;
  local_amount?: number;
  local_currency?: string;
  operation_type?: string;
  label?: string;
  note?: string;
  reference?: string;
  category?: string;
  counterparty_name?: string;
  counterparty_iban?: string;
  emitted_at?: string;
  settled_at?: string;
  status?: string;
  attachment_ids?: string[];
  label_ids?: string[];
  vat_amount?: number;
  vat_rate?: number;
  raw_data?: Record<string, unknown>;
  synced_at?: string;
  updated_at?: string;
}

// =====================================================================
// SERVICE CLASS
// =====================================================================

export class QontoSyncService {
  private supabase = createClient();
  private qontoClient: QontoClient;

  constructor(qontoClient?: QontoClient) {
    if (qontoClient) {
      this.qontoClient = qontoClient;
    } else {
      // Créer un client avec les variables d'environnement
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
    // NOTE: RPC non typée car la migration n'est pas encore appliquée aux types générés
    const { data, error } = await (this.supabase.rpc as CallableFunction)(
      'get_last_sync_status',
      { p_sync_type: syncType }
    );

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

    const row = data[0] as Record<string, unknown>;
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
      maxPages = 50,
      pageSize = 100,
      timeoutSeconds = 300,
      onProgress,
    } = options;

    const errors: SyncError[] = [];
    let syncRunId: string = '';
    let lockToken: string = '';
    const startTime = Date.now();

    try {
      // 1. Acquérir le lock (anti-boucle)
      // NOTE: RPC non typée car la migration n'est pas encore appliquée aux types générés
      const lockResult = await (this.supabase.rpc as CallableFunction)(
        'acquire_sync_lock',
        {
          p_sync_type: 'transactions',
          p_lock_duration_seconds: timeoutSeconds,
        }
      );

      if (lockResult.error) {
        throw new Error(`Erreur acquisition lock: ${lockResult.error.message}`);
      }

      const lockData = (
        lockResult.data as Array<Record<string, unknown>> | null
      )?.[0];
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

      // 2. Déterminer la date de début
      let syncFrom: Date;
      if (fullSync) {
        syncFrom = new Date('2020-01-01');
      } else if (since) {
        syncFrom = since;
      } else {
        // Par défaut: dernière sync ou 30 jours
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

      // 4. Sync pagination
      let cursor: string | undefined;
      let currentPage = 0;
      let totalFetched = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;

      const mainAccount = bankAccounts[0]; // Compte principal

      do {
        // Notifier la progression
        onProgress?.({
          currentPage,
          totalItems: totalFetched,
          itemsProcessed: totalCreated + totalUpdated + totalSkipped,
          status: 'fetching',
        });

        // Récupérer une page de transactions
        const response = await this.qontoClient.getTransactions({
          bankAccountId: mainAccount.id,
          updatedAtFrom: syncFrom.toISOString(),
          perPage: pageSize,
          currentPage: currentPage + 1,
        });

        // getTransactions retourne QontoTransactionsResponse
        const transactions = response.transactions;
        totalFetched += transactions.length;

        onProgress?.({
          currentPage,
          totalItems: totalFetched,
          itemsProcessed: totalCreated + totalUpdated + totalSkipped,
          status: 'processing',
        });

        // Traiter chaque transaction
        for (const tx of transactions) {
          try {
            const result = await this.upsertTransaction(tx, mainAccount.id);
            if (result === 'created') totalCreated++;
            else if (result === 'updated') totalUpdated++;
            else totalSkipped++;
          } catch (err) {
            totalFailed++;
            errors.push({
              transactionId: tx.transaction_id,
              code: 'UPSERT_ERROR',
              message: err instanceof Error ? err.message : 'Erreur inconnue',
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Préparer la page suivante
        currentPage++;

        // Vérifier les limites
        if (transactions.length < pageSize) {
          // Dernière page atteinte
          break;
        }
        if (currentPage >= maxPages) {
          // Limite de pages atteinte
          break;
        }
        if (Date.now() - startTime > timeoutSeconds * 1000) {
          // Timeout
          break;
        }
      } while (true);

      // 5. Relâcher le lock avec succès
      const finalStatus: SyncRunStatus =
        totalFailed > 0
          ? 'partial'
          : errors.length > 0
            ? 'partial'
            : 'completed';

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
        p_cursor: cursor || null,
      });

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
        message: `Sync terminée: ${totalCreated} créées, ${totalUpdated} mises à jour, ${totalSkipped} ignorées`,
      };
    } catch (err) {
      // Relâcher le lock en cas d'erreur
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
              message: err instanceof Error ? err.message : 'Erreur inconnue',
              timestamp: new Date().toISOString(),
            },
          ]),
          p_cursor: null,
        });
      }

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
            message: err instanceof Error ? err.message : 'Erreur inconnue',
            timestamp: new Date().toISOString(),
          },
        ],
        message:
          err instanceof Error ? err.message : 'Erreur de synchronisation',
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
    // Vérifier si la transaction existe déjà
    const { data: existing } = await this.supabase
      .from('bank_transactions')
      .select('id, updated_at')
      .eq('transaction_id', tx.transaction_id)
      .single();

    const transactionData: TransactionDbData = {
      transaction_id: tx.transaction_id,
      bank_provider: 'qonto',
      bank_account_id: bankAccountId,
      amount: tx.amount,
      currency: tx.currency,
      side: tx.side,
      // Champs optionnels (undefined si non définis)
      amount_cents: tx.amount_cents,
      local_amount: tx.local_amount,
      local_currency: tx.local_currency,
      operation_type: tx.operation_type,
      label: tx.label,
      note: tx.note,
      reference: tx.reference,
      category: tx.category,
      counterparty_name: tx.counterparty?.name,
      counterparty_iban: tx.counterparty?.iban,
      emitted_at: tx.emitted_at,
      settled_at: tx.settled_at ?? undefined,
      status: tx.status,
      attachment_ids: tx.attachment_ids,
      label_ids: tx.label_ids,
      vat_amount: tx.vat_amount,
      vat_rate: tx.vat_rate,
      raw_data: tx as unknown as Record<string, unknown>,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Vérifier si mise à jour nécessaire
      const existingDate = new Date(existing.updated_at);
      const txDate = new Date(tx.updated_at || tx.emitted_at);

      if (txDate <= existingDate) {
        return 'skipped';
      }

      // Update - cast as any car les types Supabase ne sont pas encore générés avec les nouvelles colonnes
      const { error } = await this.supabase
        .from('bank_transactions')
        .update(transactionData as never)
        .eq('id', existing.id);

      if (error) throw error;
      return 'updated';
    } else {
      // Insert - cast as any car les types Supabase ne sont pas encore générés avec les nouvelles colonnes
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
    const { data, error } = await (this.supabase.rpc as CallableFunction)(
      'cleanup_expired_sync_locks'
    );
    if (error) {
      console.error('Error cleaning up expired locks:', error);
      return 0;
    }
    return (data as number) || 0;
  }
}

// =====================================================================
// SINGLETON EXPORT
// =====================================================================

let syncServiceInstance: QontoSyncService | null = null;

export function getQontoSyncService(): QontoSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new QontoSyncService();
  }
  return syncServiceInstance;
}

// Re-export des types Qonto utiles
export type { QontoTransaction, QontoTransactionSide };
