/**
 * Types pour la page de clôture comptable [BO-COMPTA-001]
 *
 * ClotureRow unifie les lignes "présentes" (LibraryDocument) et
 * "manquantes" (LibraryMissingDocument) dans une vue unique avec
 * des signalisations calculées.
 */

/** Source d'une ligne de clôture */
export type ClotureLineKind = 'present' | 'missing';

/** Catégorie de la ligne (achats / ventes / avoirs) */
export type ClotureCategory = 'achats' | 'ventes' | 'avoirs';

/** Signalisations calculées depuis les colonnes de bank_transactions */
export interface ClotureSignals {
  /** Pièce absente (has_attachment false ou local_pdf_path null) */
  missingPiece: boolean;
  /** TVA non renseignée (vat_rate null OU vat_source null) */
  vatMissing: boolean;
  /** Code comptable absent (category_pcg null) */
  pcgMissing: boolean;
  /** Transaction ignorée (ignored_at non null) */
  ignored: boolean;
  /** Transférée au comptable — ISO string ou null */
  transferredAt: string | null;
}

/** Ligne unifiée pour la table de clôture */
export interface ClotureRow {
  /** ID de la ligne source (bank_transaction.id ou financial_document.id) */
  id: string;
  kind: ClotureLineKind;
  category: ClotureCategory;
  document_type: string;
  document_direction: string;
  document_number: string | null;
  document_date: string | null;
  partner_name: string | null;
  total_ht: number | null;
  total_ttc: number | null;
  status: string | null;
  /** Chemin local PDF (bank_transactions.local_pdf_path) */
  local_pdf_path: string | null;
  /** URL de la pièce pour aperçu */
  pdf_url: string | null;
  /** ID transaction bancaire (pour appels API) */
  transaction_id: string | null;
  /** Données brutes TVA */
  vat_rate: number | null;
  vat_source: string | null;
  /** Code comptable PCG */
  category_pcg: string | null;
  /** Facultatif (justification non requise) */
  justification_optional: boolean | null;
  /** Champ ignored_at : ISO string ou null */
  ignored_at: string | null;
  /** Signalisations calculées */
  signals: ClotureSignals;
}

/** Compteurs de synthèse pour la barre haute */
export interface ClotureCounters {
  total: number;
  present: number;
  missing: number;
  /** Lignes avec TVA ou PCG manquant (hors lignes ignorées) */
  toComplete: number;
  transferred: number;
}

/** Plan d'envoi Welyb retourné par send-to-accountant en dry-run */
export interface WelyBatchPlan {
  index: number;
  recipient: string;
  from: string;
  subject: string;
  attachmentCount: number;
  transactionIds: string[];
}

export interface WelybDryRunResponse {
  dryRun: true;
  batches: WelyBatchPlan[];
  totalPieces: number;
  scope: 'achats' | 'ventes';
  year: number;
  /** true si l'envoi réel est autorisé côté serveur (ACCOUNTANT_SEND_ENABLED) */
  sendAllowed?: boolean;
  message?: string;
}

/** Résultat d'un envoi réel send-to-accountant (confirmSend:true) */
export interface WelybSendResult {
  dryRun: false;
  batchesSent: number;
  piecesSent: number;
  piecesAlreadyTransferred: number;
  errors: Array<{ batchIndex: number; reason: string }>;
}

/** Résultat sync-qonto-attachments */
export interface SyncQontoResult {
  processed: number;
  downloaded: number;
  failed: number;
  errors: Array<{
    transactionId: string;
    attachmentId: string | null;
    reason: string;
  }>;
  message?: string;
}
