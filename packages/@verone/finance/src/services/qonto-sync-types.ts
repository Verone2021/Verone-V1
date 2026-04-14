/**
 * Types pour le service de synchronisation Qonto
 */

import type { QontoTransactionSide } from '@verone/integrations/qonto';

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
export interface TransactionDbData {
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
  attachment_ids?: string[] | null;
  updated_at?: string;
  // TVA Qonto OCR (amount_vat is computed by trigger trg_calculate_ht_vat)
  vat_rate?: number | null;
  vat_source?: 'qonto_ocr' | 'manual' | null;
  vat_breakdown?: Array<{
    description: string;
    amount_ht: number;
    tva_rate: number;
    tva_amount: number;
  }> | null;
}

/**
 * Extraire le message d'erreur d'une valeur inconnue
 */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Erreur inconnue';
}
