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
import { createAdminClient } from '@verone/utils/supabase/server';

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
  /**
   * Scope de synchronisation:
   * - 'incremental': Sync depuis la dernière sync (défaut)
   * - 'all': Sync TOUT l'historique depuis fromDate (backfill complet)
   */
  syncScope?: 'incremental' | 'all';
  /** Date de début pour scope=all (défaut: 2022-01-01) */
  fromDate?: string;
  /** Nombre max de pages à traiter (défaut: 50, scope=all: 1000) */
  maxPages?: number;
  /** Nombre d'items par page (défaut: 100, max: 100) */
  pageSize?: number;
  /** Timeout en secondes (défaut: 300, scope=all: 900) */
  timeoutSeconds?: number;
  /** Créer automatiquement les expenses pour les débits */
  autoCreateExpenses?: boolean;
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
// Colonnes existantes dans bank_transactions
interface TransactionDbData {
  transaction_id: string;
  bank_provider: 'qonto' | 'revolut';
  bank_account_id: string;
  amount: number;
  currency: string;
  side: QontoTransactionSide;
  operation_type?: string;
  label?: string;
  note?: string;
  reference?: string;
  counterparty_name?: string;
  counterparty_iban?: string;
  emitted_at?: string;
  settled_at?: string;
  raw_data?: Record<string, unknown>;
  updated_at?: string;
  // TVA Qonto OCR
  vat_rate?: number | null;
  vat_amount?: number | null;
  vat_source?: 'qonto_ocr' | 'manual' | null;
  vat_breakdown?: Array<{
    description: string;
    amount_ht: number;
    tva_rate: number;
    tva_amount: number;
  }> | null;
}

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
   *
   * @param options.syncScope - 'incremental' (défaut) ou 'all' pour backfill complet
   * @param options.fromDate - Date de début pour scope=all (défaut: '2022-01-01')
   * @param options.autoCreateExpenses - Créer automatiquement les expenses pour débits
   */
  async syncTransactions(options: SyncOptions = {}): Promise<SyncResult> {
    const {
      since,
      fullSync = false,
      syncScope = 'incremental',
      fromDate = '2022-01-01',
      maxPages = syncScope === 'all' ? 1000 : 50, // Plus de pages pour backfill
      pageSize = 100,
      timeoutSeconds = syncScope === 'all' ? 900 : 300, // 15 min pour backfill
      autoCreateExpenses = true,
      onProgress,
    } = options;

    // Log mode de sync
    console.log(
      `[Qonto Sync] Starting sync: scope=${syncScope}, fromDate=${fromDate}, maxPages=${maxPages}`
    );

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

      // 2. Déterminer la date de début selon le mode
      let syncFrom: Date | null = null; // null = pas de filtre date (scope=all sans limite)

      if (syncScope === 'all') {
        // Backfill complet depuis fromDate
        syncFrom = new Date(fromDate);
        console.log(`[Qonto Sync] Backfill mode: syncing from ${fromDate}`);
      } else if (fullSync) {
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

      // 4. Sync pagination - TOUS les comptes bancaires
      let cursor: string | undefined;
      let totalFetched = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;

      // Parcourir TOUS les comptes bancaires
      for (const account of bankAccounts) {
        let currentPage = 0;
        // Compteurs par compte pour le logging
        const accountStats = { fetched: 0, created: 0, updated: 0, skipped: 0 };

        do {
          // Notifier la progression
          onProgress?.({
            currentPage,
            totalItems: totalFetched,
            itemsProcessed: totalCreated + totalUpdated + totalSkipped,
            status: 'fetching',
          });

          // Récupérer une page de transactions (completed uniquement)
          const response = await this.qontoClient.getTransactions({
            bankAccountId: account.id,
            status: 'completed',
            // Pour scope=all avec fromDate, on utilise updatedAtFrom
            // Si syncFrom est null (pas de filtre), on ne passe pas le paramètre
            ...(syncFrom ? { updatedAtFrom: syncFrom.toISOString() } : {}),
            perPage: pageSize,
            currentPage: currentPage + 1,
          });

          // getTransactions retourne QontoTransactionsResponse
          const transactions = response.transactions;
          totalFetched += transactions.length;
          accountStats.fetched += transactions.length;

          onProgress?.({
            currentPage,
            totalItems: totalFetched,
            itemsProcessed: totalCreated + totalUpdated + totalSkipped,
            status: 'processing',
          });

          // Traiter chaque transaction
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
                message: err instanceof Error ? err.message : 'Erreur inconnue',
                timestamp: new Date().toISOString(),
              });
            }
          }

          // Préparer la page suivante
          currentPage++;

          // Vérifier les limites
          if (transactions.length < pageSize) {
            // Dernière page de ce compte atteinte
            break;
          }
          if (currentPage >= maxPages) {
            // Limite de pages atteinte pour ce compte
            break;
          }
          if (Date.now() - startTime > timeoutSeconds * 1000) {
            // Timeout
            break;
          }
        } while (true);

        // Log par compte bancaire (observabilité)
        console.log(
          `[Qonto Sync] Account ${account.name} (${account.id.slice(0, 8)}...):`,
          `fetched=${accountStats.fetched},`,
          `created=${accountStats.created},`,
          `updated=${accountStats.updated},`,
          `skipped=${accountStats.skipped}`
        );

        // Vérifier timeout global
        if (Date.now() - startTime > timeoutSeconds * 1000) {
          break;
        }
      }

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

      // 6. Auto-créer les expenses pour les nouvelles transactions débit
      let expensesCreated = 0;
      if (autoCreateExpenses && (totalCreated > 0 || totalUpdated > 0)) {
        try {
          const { data } = await (this.supabase.rpc as CallableFunction)(
            'create_expenses_from_debits'
          );
          expensesCreated = data || 0;
          console.log(
            `[Qonto Sync] Auto-created ${expensesCreated} expenses for debit transactions`
          );
        } catch (expenseErr) {
          console.error('[Qonto Sync] Error creating expenses:', expenseErr);
          // Ne pas faire échouer la sync pour ça
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

    // Extraire vat_details de Qonto si disponible (OCR multi-TVA)
    let vat_breakdown: TransactionDbData['vat_breakdown'] = null;
    if (tx.vat_details?.items && tx.vat_details.items.length > 0) {
      vat_breakdown = tx.vat_details.items.map((item, idx) => ({
        description: `Ligne ${idx + 1}`,
        amount_ht: 0, // Qonto ne fournit pas le HT
        tva_rate: item.rate,
        tva_amount: item.amount_cents / 100,
      }));
    }

    // Déterminer la source de la TVA
    // vat_rate = -1 signifie que Qonto n'a pas pu analyser (pas de justificatif ou OCR échoué)
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
      updated_at: new Date().toISOString(),
      // TVA Qonto OCR - stocker uniquement si valide (pas -1)
      // Si Qonto retourne une TVA simple, on EFFACE vat_breakdown pour éviter les conflits
      vat_rate: hasQontoVat ? tx.vat_rate : null,
      vat_amount: hasQontoVat ? tx.vat_amount : null,
      vat_source: hasQontoVat ? 'qonto_ocr' : null,
      vat_breakdown: hasQontoVat ? null : vat_breakdown,
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
