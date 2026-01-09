// =====================================================================
// Qonto API Types
// Date: 2025-10-11
// Description: Types TypeScript pour intégration Qonto Banking API
// =====================================================================

// =====================================================================
// CONFIGURATION
// =====================================================================

/**
 * Mode d'authentification Qonto
 * - oauth: Authorization: Bearer <access_token> (recommandé pour Business API)
 * - api_key: Authorization: <orgId>:<apiKey> (legacy thirdparty)
 */
export type QontoAuthMode = 'oauth' | 'api_key';

/**
 * Configuration du client Qonto
 */
export interface QontoConfig {
  // Mode d'authentification (défaut: oauth)
  authMode?: QontoAuthMode;

  // Pour mode api_key
  organizationId?: string;
  apiKey?: string;

  // Pour mode oauth
  accessToken?: string;
  refreshToken?: string;

  // Endpoints
  baseUrl?: string; // https://thirdparty.qonto.com (v2 ajouté automatiquement)

  // Timeouts et retry
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Résultat du health check Qonto
 */
export interface QontoHealthCheckResult {
  healthy: boolean;
  authMode: QontoAuthMode;
  timestamp: string;
  bankAccountsCount?: number;
  sampleBankAccountId?: string;
  error?: string;
}

// =====================================================================
// BANK ACCOUNTS
// =====================================================================

export interface QontoBankAccount {
  id: string;
  slug: string;
  iban: string;
  bic: string;
  currency: string;
  balance: number;
  authorized_balance: number;
  balance_cents: number;
  authorized_balance_cents: number;
  name: string;
  status: 'active' | 'closed';
  updated_at: string;
}

export interface QontoBalance {
  account_id: string;
  balance: number;
  currency: string;
  authorized_balance: number;
}

// =====================================================================
// TRANSACTIONS
// =====================================================================

export type QontoTransactionStatus =
  | 'pending'
  | 'declined'
  | 'reversed'
  | 'completed';
export type QontoTransactionSide = 'credit' | 'debit';
export type QontoOperationType =
  | 'transfer'
  | 'card'
  | 'direct_debit'
  | 'qonto_fee'
  | 'check'
  | 'income'
  | 'recall';

export interface QontoCounterparty {
  name: string;
  iban?: string;
  bic?: string;
}

export interface QontoAttachment {
  id: string;
  url: string;
  file_name: string;
  file_size: number;
  file_content_type: string;
  created_at: string;
}

export interface QontoTransaction {
  transaction_id: string;
  amount: number;
  amount_cents: number;
  currency: string;
  local_amount?: number;
  local_amount_cents?: number;
  local_currency?: string;
  side: QontoTransactionSide;
  operation_type: QontoOperationType;
  label: string;
  settled_at: string | null;
  emitted_at: string;
  updated_at: string;
  status: QontoTransactionStatus;
  note?: string;
  reference?: string;
  vat_amount?: number;
  vat_amount_cents?: number;
  vat_rate?: number;
  /** Détails TVA multi-taux (si OCR Qonto activé) */
  vat_details?: {
    status?: 'computed' | 'not_computed' | 'pending';
    items?: Array<{
      rate: number;
      amount_cents: number;
    }>;
  };
  initiator_id?: string;
  label_ids?: string[];
  attachment_ids?: string[];
  attachments?: QontoAttachment[];
  card_last_digits?: string;
  category?: string;
  counterparty?: QontoCounterparty;
  bank_account_id?: string;
}

// =====================================================================
// API RESPONSES
// =====================================================================

export interface QontoApiResponse<T> {
  [key: string]: any;
}

export interface QontoTransactionsResponse {
  transactions: QontoTransaction[];
  meta: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

// =====================================================================
// WEBHOOKS
// =====================================================================

export type QontoWebhookEvent =
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.declined'
  | 'card.updated'
  | 'transfer.created'
  | 'transfer.updated';

export interface QontoWebhookPayload {
  event_name: QontoWebhookEvent;
  event_id: string;
  organization_slug: string;
  created_at: string;
  data: {
    transaction?: QontoTransaction;
    [key: string]: any;
  };
}

// =====================================================================
// REQUEST PARAMETERS
// =====================================================================

export interface GetTransactionsParams {
  bankAccountId?: string;
  status?: QontoTransactionStatus | QontoTransactionStatus[];
  updatedAtFrom?: string; // ISO 8601 format
  updatedAtTo?: string;
  settledAtFrom?: string;
  settledAtTo?: string;
  sortBy?: 'settled_at' | 'emitted_at' | 'updated_at';
  perPage?: number; // Default 20, max 100
  currentPage?: number;
}

// =====================================================================
// MATCHING & RECONCILIATION (Vérone internal)
// =====================================================================

export type MatchingStatus =
  | 'unmatched' // Transaction non rapprochée
  | 'auto_matched' // Rapprochement automatique (95%)
  | 'manual_matched' // Rapprochement manuel (5%)
  | 'partial_matched' // Paiement partiel
  | 'ignored'; // Transaction ignorée (frais, etc.)

export interface BankTransaction {
  id: string;
  transaction_id: string;
  bank_provider: 'qonto' | 'revolut';
  bank_account_id: string;
  amount: number;
  currency: string;
  side: QontoTransactionSide;
  operation_type: QontoOperationType;
  label: string;
  counterparty_name?: string;
  counterparty_iban?: string;
  settled_at: string | null;
  emitted_at: string;
  matching_status: MatchingStatus;
  matched_payment_id?: string;
  matched_invoice_id?: string;
  confidence_score?: number; // 0-100% pour auto-match
  raw_data: QontoTransaction; // JSONB original
  created_at: string;
  updated_at: string;
}

export interface AutoMatchResult {
  matched: boolean;
  confidence: number;
  payment_id?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount_difference?: number;
  match_reason?: string;
}

// =====================================================================
// CLIENT INVOICES (Factures clients Qonto)
// =====================================================================

export type QontoInvoiceStatus =
  | 'draft'
  | 'unpaid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface QontoInvoiceItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  total_amount?: number;
  total_amount_cents?: number;
}

export interface QontoClientInvoice {
  id: string;
  invoice_number: string;
  status: QontoInvoiceStatus;
  currency: string;

  // Client
  client_id: string;
  client?: QontoClient;

  // Dates
  issue_date: string;
  payment_deadline: string;
  performance_start_date?: string;
  performance_end_date?: string;
  paid_at?: string;

  // Montants
  total_amount: number;
  total_amount_cents: number;
  total_vat_amount: number;
  total_vat_amount_cents: number;
  subtotal_amount: number;
  subtotal_amount_cents: number;

  // Items
  items: QontoInvoiceItem[];

  // Références
  purchase_order_number?: string;

  // PDF - attachment_id est la clé pour télécharger via /v2/attachments/{id}
  attachment_id?: string;
  pdf_url?: string;
  public_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  finalized_at?: string;
  cancelled_at?: string;
}

// =====================================================================
// CLIENTS (Clients Qonto)
// =====================================================================

export interface QontoClientAddress {
  street_address?: string;
  city?: string;
  zip_code?: string;
  country_code?: string;
}

export interface QontoClientEntity {
  id: string;
  name: string;
  email?: string;
  currency: string;
  vat_number?: string;
  address?: QontoClientAddress;
  phone?: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

// Alias pour compatibilité
export type QontoClient = QontoClientEntity;

// =====================================================================
// LABELS (Étiquettes Qonto)
// =====================================================================

export interface QontoLabel {
  id: string;
  name: string;
  color: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// PARAMS DE CRÉATION
// =====================================================================

/**
 * Payment methods pour les factures clients
 * Selon doc Qonto: objet avec IBAN obligatoire
 */
export interface QontoPaymentMethods {
  iban: string; // IBAN Qonto valide (2 lettres + 25 chiffres)
}

/**
 * Paramètres pour créer une facture client
 * Doc: https://docs.qonto.com/api-reference/business-api/expense-management/client-quotes-notes/client-invoices/create-a-client-invoice
 */
export interface CreateClientInvoiceParams {
  clientId: string;
  currency?: string; // Défaut: EUR (seule devise supportée)
  issueDate: string; // YYYY-MM-DD - Date d'émission
  dueDate: string; // YYYY-MM-DD - Date d'échéance (anciennement paymentDeadline)
  paymentMethods: QontoPaymentMethods; // OBLIGATOIRE - Objet avec IBAN
  performanceStartDate?: string; // YYYY-MM-DD
  performanceEndDate?: string; // YYYY-MM-DD
  purchaseOrderNumber?: string;
  number?: string; // Optionnel - Qonto génère si non fourni (max 40 chars)
  header?: string;
  footer?: string;
  termsAndConditions?: string;
  items: CreateInvoiceItemParams[];
}

/**
 * Prix avec devise (format Qonto)
 */
export interface QontoAmount {
  value: string; // Décimal en string, ex: "150.00"
  currency: string; // ISO 4217, ex: "EUR"
}

/**
 * Paramètres pour un item de facture
 */
export interface CreateInvoiceItemParams {
  title: string; // Max 40 chars
  description?: string;
  quantity: string; // Décimal en string, ex: "2.5"
  unit?: string; // Ex: "hour", "piece", "kg"
  unitPrice: QontoAmount; // Prix unitaire HT avec devise
  vatRate: string; // Décimal en string, ex: "0.20" pour 20%
}

// =====================================================================
// SUPPLIER INVOICES (Factures fournisseurs)
// =====================================================================

/**
 * Paramètres pour upload bulk de factures fournisseurs
 * Doc: https://docs.qonto.com/api-reference/business-api/expense-management/supplier-invoices/create-supplier-invoices
 */
export interface UploadSupplierInvoiceParams {
  file: Blob | File;
  idempotencyKey: string; // UUID unique pour éviter doublons
}

/**
 * Résultat d'un upload de facture fournisseur
 */
export interface QontoSupplierInvoice {
  id: string;
  invoice_number?: string;
  supplier_name?: string;
  total_amount?: QontoAmount;
  status: 'to_review' | 'to_pay' | 'paid' | 'canceled';
}

/**
 * Résultat du bulk upload de factures fournisseurs
 */
export interface UploadSupplierInvoicesResult {
  supplier_invoices: QontoSupplierInvoice[];
  errors: Array<{
    idempotency_key?: string;
    message: string;
    details?: unknown;
  }>;
}

export interface CreateClientParams {
  name: string;
  type: 'company' | 'individual'; // Required by Qonto API
  email?: string;
  currency?: string;
  vatNumber?: string; // TVA intracommunautaire (ex: FR12345678901)
  taxIdentificationNumber?: string; // TIN / SIRET - requis pour facturation
  address?: {
    streetAddress?: string;
    city?: string;
    zipCode?: string;
    countryCode?: string;
  };
  phone?: string;
  locale?: string;
}

// =====================================================================
// SYNC RESULTS (Résultats de synchronisation)
// =====================================================================

export interface QontoSyncResult {
  success: boolean;
  syncType: 'transactions' | 'invoices' | 'clients' | 'attachments';
  syncDirection: 'pull' | 'push';
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  errors?: Array<{
    item_id?: string;
    error: string;
    details?: unknown;
  }>;
  syncedAt: Date;
}

// =====================================================================
// CLIENT CREDIT NOTES (Avoirs clients Qonto)
// Date: 2026-01-07
// =====================================================================

export type QontoCreditNoteStatus = 'draft' | 'finalized';

export interface QontoClientCreditNote {
  id: string;
  credit_note_number: string;
  status: QontoCreditNoteStatus;
  currency: string;

  // Client
  client_id: string;
  client?: QontoClientEntity;

  // Facture liée (optionnel)
  invoice_id?: string;
  invoice?: QontoClientInvoice;

  // Dates
  issue_date: string;

  // Montants
  total_amount: number;
  total_amount_cents: number;
  total_vat_amount: number;
  total_vat_amount_cents: number;
  subtotal_amount: number;
  subtotal_amount_cents: number;

  // Items
  items: QontoCreditNoteItem[];

  // Motif de l'avoir
  reason?: string;

  // PDF - attachment_id est la clé pour télécharger via /v2/attachments/{id}
  attachment_id?: string;
  pdf_url?: string;
  public_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  finalized_at?: string;
}

export interface QontoCreditNoteItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  total_amount?: number;
  total_amount_cents?: number;
}

/**
 * Paramètres pour créer un avoir client
 * Doc: https://docs.qonto.com/api-reference/business-api/expense-management/client-quotes-notes/client-credit-notes
 */
export interface CreateClientCreditNoteParams {
  clientId: string;
  currency?: string;
  issueDate: string; // YYYY-MM-DD
  invoiceId?: string; // Facture de référence (optionnel)
  reason?: string; // Motif de l'avoir
  items: CreateCreditNoteItemParams[];
}

export interface CreateCreditNoteItemParams {
  title: string;
  description?: string;
  quantity: string; // Décimal en string
  unit?: string;
  unitPrice: QontoAmount;
  vatRate: string; // Décimal en string, ex: "0.20"
}

// =====================================================================
// CLIENT QUOTES (Devis clients Qonto)
// Date: 2026-01-07
// =====================================================================

export type QontoQuoteStatus =
  | 'draft'
  | 'pending_approval' // Qonto uses this for draft quotes
  | 'finalized'
  | 'accepted'
  | 'declined'
  | 'expired';

export interface QontoClientQuote {
  id: string;
  quote_number: string;
  status: QontoQuoteStatus;
  currency: string;

  // Client
  client_id: string;
  client?: QontoClientEntity;

  // Dates
  issue_date: string;
  expiry_date: string; // Date d'expiration du devis
  accepted_at?: string;
  declined_at?: string;

  // Montants
  total_amount: number;
  total_amount_cents: number;
  total_vat_amount: number;
  total_vat_amount_cents: number;
  subtotal_amount: number;
  subtotal_amount_cents: number;

  // Items
  items: QontoQuoteItem[];

  // Références
  purchase_order_number?: string;

  // Textes personnalisés
  header?: string;
  footer?: string;
  terms_and_conditions?: string;

  // PDF - attachment_id est la clé pour télécharger via /v2/attachments/{id}
  attachment_id?: string;
  pdf_url?: string;
  public_url?: string;

  // Conversion en facture
  converted_to_invoice_id?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  finalized_at?: string;
}

export interface QontoQuoteItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  total_amount?: number;
  total_amount_cents?: number;
}

/**
 * Paramètres pour créer un devis client
 * Doc: https://docs.qonto.com/api-reference/business-api/expense-management/client-quotes-notes/client-quotes
 */
export interface CreateClientQuoteParams {
  clientId: string;
  currency?: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD - Date d'expiration
  purchaseOrderNumber?: string;
  header?: string;
  footer?: string;
  termsAndConditions?: string;
  items: CreateQuoteItemParams[];
}

export interface CreateQuoteItemParams {
  title: string;
  description?: string;
  quantity: string; // Décimal en string
  unit?: string;
  unitPrice: QontoAmount;
  vatRate: string; // Décimal en string, ex: "0.20"
}
