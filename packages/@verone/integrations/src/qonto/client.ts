// =====================================================================
// Qonto API Client
// Date: 2025-10-11
// Description: Client HTTP pour API Qonto avec retry logic
// =====================================================================

import { QontoError } from './errors';
import type {
  QontoTransaction,
  QontoBankAccount,
  QontoBalance,
  QontoApiResponse,
  QontoConfig,
  QontoAuthMode,
  QontoHealthCheckResult,
  QontoClientInvoice,
  QontoClientEntity,
  QontoAttachment,
  QontoLabel,
  CreateClientInvoiceParams,
  CreateClientParams,
  UploadSupplierInvoiceParams,
  UploadSupplierInvoicesResult,
} from './types';

// =====================================================================
// HELPERS
// =====================================================================

/**
 * Génère une clé d'idempotency UUID v4
 */
function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Détermine le mode d'auth à partir des env vars
 * GUARDRAIL: Si les deux modes sont configurés simultanément → throw
 */
function resolveAuthMode(): QontoAuthMode {
  const hasOAuthToken = !!process.env.QONTO_ACCESS_TOKEN;
  const hasApiKey =
    !!process.env.QONTO_ORGANIZATION_ID && !!process.env.QONTO_API_KEY;
  const envMode = process.env.QONTO_AUTH_MODE?.toLowerCase();

  // GUARDRAIL: Détecter conflit de configuration
  if (hasOAuthToken && hasApiKey && !envMode) {
    throw new QontoError(
      'AUTH CONFLICT: Both OAuth (QONTO_ACCESS_TOKEN) and API Key ' +
        '(QONTO_ORGANIZATION_ID + QONTO_API_KEY) are configured. ' +
        'Set QONTO_AUTH_MODE=oauth OR QONTO_AUTH_MODE=api_key explicitly, ' +
        'or remove one set of credentials. Recommended: use OAuth only.',
      'AUTH_CONFIG_CONFLICT',
      0
    );
  }

  // Mode explicite
  if (envMode === 'api_key') return 'api_key';
  if (envMode === 'oauth') return 'oauth';

  // Auto-détection (un seul mode configuré)
  if (hasOAuthToken) return 'oauth';
  if (hasApiKey) return 'api_key';

  return 'oauth'; // Défaut OAuth si rien n'est configuré
}

// =====================================================================
// CLIENT
// =====================================================================

export class QontoClient {
  private config: Required<
    Pick<
      QontoConfig,
      'authMode' | 'baseUrl' | 'timeout' | 'maxRetries' | 'retryDelay'
    >
  > &
    QontoConfig;
  private baseUrl: string;
  private authMode: QontoAuthMode;

  constructor(config?: Partial<QontoConfig>) {
    // Déterminer le mode d'auth
    this.authMode = config?.authMode || resolveAuthMode();

    this.config = {
      authMode: this.authMode,
      // Credentials API Key
      organizationId:
        config?.organizationId || process.env.QONTO_ORGANIZATION_ID,
      apiKey: config?.apiKey || process.env.QONTO_API_KEY,
      // Credentials OAuth
      accessToken: config?.accessToken || process.env.QONTO_ACCESS_TOKEN,
      refreshToken: config?.refreshToken || process.env.QONTO_REFRESH_TOKEN,
      // Endpoint
      baseUrl:
        config?.baseUrl ||
        process.env.QONTO_API_BASE_URL ||
        'https://thirdparty.qonto.com',
      // Timeouts
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
    };

    this.baseUrl = this.config.baseUrl;

    // Validation des credentials selon le mode
    this.validateCredentials();
  }

  /**
   * Valide que les credentials nécessaires sont présents
   */
  private validateCredentials(): void {
    if (this.authMode === 'oauth') {
      if (!this.config.accessToken) {
        throw new QontoError(
          'OAuth mode requires QONTO_ACCESS_TOKEN. ' +
            'Set QONTO_AUTH_MODE=api_key if using API Key authentication.',
          'AUTH_CONFIG_ERROR',
          0
        );
      }
    } else {
      // api_key mode
      if (!this.config.organizationId || !this.config.apiKey) {
        throw new QontoError(
          'API Key mode requires QONTO_ORGANIZATION_ID and QONTO_API_KEY. ' +
            'Set QONTO_AUTH_MODE=oauth if using OAuth authentication.',
          'AUTH_CONFIG_ERROR',
          0
        );
      }
    }
  }

  /**
   * Construit le header Authorization selon le mode
   */
  private getAuthHeader(): string {
    if (this.authMode === 'oauth') {
      return `Bearer ${this.config.accessToken}`;
    }
    // api_key mode: orgId:apiKey
    return `${this.config.organizationId}:${this.config.apiKey}`;
  }

  /**
   * Retourne le mode d'auth actuel
   */
  getAuthMode(): QontoAuthMode {
    return this.authMode;
  }

  // ===================================================================
  // HTTP REQUEST WITH RETRY
  // ===================================================================

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options?: { retryCount?: number }
  ): Promise<T> {
    const { retryCount = 0 } = options || {};
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Success
      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      // Error handling
      const errorData = await response.json().catch(() => ({}));
      const error = this.createErrorFromResponse(response.status, errorData);

      // Retry logic
      if (this.shouldRetry(error) && retryCount < this.config.maxRetries) {
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.request<T>(method, endpoint, body, {
          retryCount: retryCount + 1,
        });
      }

      throw error;
    } catch (err) {
      clearTimeout(timeout);

      if (err instanceof QontoError) {
        throw err;
      }

      // Timeout error
      if (err instanceof Error && err.name === 'AbortError') {
        const timeoutError = new QontoError('Request timeout', 'TIMEOUT', 408, {
          timeout: this.config.timeout,
        });

        if (retryCount < this.config.maxRetries) {
          const delay = this.calculateRetryDelay(retryCount);
          await this.sleep(delay);
          return this.request<T>(method, endpoint, body, {
            retryCount: retryCount + 1,
          });
        }

        throw timeoutError;
      }

      // Network error
      throw new QontoError(
        err instanceof Error ? err.message : 'Network error',
        'NETWORK_ERROR',
        0
      );
    }
  }

  /**
   * Requête avec header d'idempotency (pour POST/PUT/DELETE)
   * Doc: https://docs.qonto.com/api-reference/business-api/expense-management/attachments-in-transactions/upload-an-attachment-to-a-transaction
   */
  private async requestWithIdempotency<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body: unknown,
    idempotencyKey: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
          'X-Qonto-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      const errorData = await response.json().catch(() => ({}));
      throw this.createErrorFromResponse(response.status, errorData);
    } catch (err) {
      clearTimeout(timeout);

      if (err instanceof QontoError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new QontoError('Request timeout', 'TIMEOUT', 408, {
          timeout: this.config.timeout,
        });
      }

      throw new QontoError(
        err instanceof Error ? err.message : 'Network error',
        'NETWORK_ERROR',
        0
      );
    }
  }

  // ===================================================================
  // ORGANIZATION (Health Check)
  // ===================================================================

  /**
   * Récupère les informations de l'organisation
   * Utilisé pour le health check et la validation des credentials
   */
  async getOrganization(): Promise<{
    slug: string;
    legal_name: string;
    legal_number: string;
    legal_share_capital: number;
    legal_vat_number: string;
    address: {
      street: string;
      zip_code: string;
      city: string;
      country_code: string;
    };
  }> {
    const response = await this.request<
      QontoApiResponse<{
        organization: {
          slug: string;
          legal_name: string;
          legal_number: string;
          legal_share_capital: number;
          legal_vat_number: string;
          address: {
            street: string;
            zip_code: string;
            city: string;
            country_code: string;
          };
        };
      }>
    >('GET', '/v2/organization');
    return response.organization;
  }

  /**
   * Vérifie que les credentials Qonto sont valides
   * Utilise /v2/bank_accounts (endpoint fiable) au lieu de /v2/organization
   *
   * @returns Résultat du health check avec détails
   */
  async healthCheck(): Promise<QontoHealthCheckResult> {
    const timestamp = new Date().toISOString();

    try {
      // Utiliser bank_accounts car c'est un endpoint fiable et léger
      const accounts = await this.getBankAccounts();

      return {
        healthy: true,
        authMode: this.authMode,
        timestamp,
        bankAccountsCount: accounts.length,
        sampleBankAccountId: accounts[0]?.id,
      };
    } catch (error) {
      // En cas d'erreur, retourner un résultat unhealthy avec détails
      return {
        healthy: false,
        authMode: this.authMode,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===================================================================
  // BANK ACCOUNTS
  // ===================================================================

  async getBankAccounts(): Promise<QontoBankAccount[]> {
    const response = await this.request<
      QontoApiResponse<{ bank_accounts: QontoBankAccount[] }>
    >('GET', '/v2/bank_accounts');
    return response.bank_accounts;
  }

  async getBankAccountById(accountId: string): Promise<QontoBankAccount> {
    const accounts = await this.getBankAccounts();
    const account = accounts.find(
      acc => acc.slug === accountId || acc.id === accountId
    );

    if (!account) {
      throw new QontoError(
        `Bank account ${accountId} not found`,
        'NOT_FOUND',
        404
      );
    }

    return account;
  }

  // ===================================================================
  // TRANSACTIONS
  // ===================================================================

  async getTransactions(params?: {
    bankAccountId?: string;
    status?: string;
    updatedAtFrom?: string;
    updatedAtTo?: string;
    settledAtFrom?: string;
    settledAtTo?: string;
    sortBy?: string;
    perPage?: number;
    currentPage?: number;
  }): Promise<{
    transactions: QontoTransaction[];
    meta: { total_count: number };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.bankAccountId)
      queryParams.append('bank_account_id', params.bankAccountId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.updatedAtFrom)
      queryParams.append('updated_at_from', params.updatedAtFrom);
    if (params?.updatedAtTo)
      queryParams.append('updated_at_to', params.updatedAtTo);
    if (params?.settledAtFrom)
      queryParams.append('settled_at_from', params.settledAtFrom);
    if (params?.settledAtTo)
      queryParams.append('settled_at_to', params.settledAtTo);
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.perPage)
      queryParams.append('per_page', params.perPage.toString());
    if (params?.currentPage)
      queryParams.append('page', params.currentPage.toString());

    const endpoint = `/v2/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await this.request<
      QontoApiResponse<{
        transactions: QontoTransaction[];
        meta: { total_count: number };
      }>
    >('GET', endpoint);

    return {
      transactions: response.transactions,
      meta: response.meta,
    };
  }

  async getTransactionById(transactionId: string): Promise<QontoTransaction> {
    const response = await this.request<
      QontoApiResponse<{ transaction: QontoTransaction }>
    >('GET', `/v2/transactions/${transactionId}`);
    return response.transaction;
  }

  // ===================================================================
  // BALANCE (temps réel)
  // ===================================================================

  async getBalance(bankAccountId?: string): Promise<QontoBalance> {
    const accounts = await this.getBankAccounts();

    if (bankAccountId) {
      const account = accounts.find(
        acc => acc.slug === bankAccountId || acc.id === bankAccountId
      );
      if (!account) {
        throw new QontoError(
          `Bank account ${bankAccountId} not found`,
          'NOT_FOUND',
          404
        );
      }

      return {
        account_id: account.id,
        balance: account.balance,
        currency: account.currency,
        authorized_balance: account.authorized_balance,
      };
    }

    // Somme de tous les comptes
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      account_id: 'all',
      balance: totalBalance,
      currency: 'EUR',
      authorized_balance: totalBalance,
    };
  }

  // ===================================================================
  // CLIENT INVOICES (Factures clients)
  // ===================================================================

  /**
   * Liste les factures clients
   * @param params Paramètres de filtrage
   */
  async getClientInvoices(params?: {
    status?: 'draft' | 'unpaid' | 'paid' | 'overdue' | 'cancelled';
    perPage?: number;
    currentPage?: number;
  }): Promise<{
    client_invoices: QontoClientInvoice[];
    meta: { total_count: number; current_page: number; total_pages: number };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.perPage)
      queryParams.append('per_page', params.perPage.toString());
    if (params?.currentPage)
      queryParams.append('page', params.currentPage.toString());

    const endpoint = `/v2/client_invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await this.request<
      QontoApiResponse<{
        client_invoices: QontoClientInvoice[];
        meta: {
          total_count: number;
          current_page: number;
          total_pages: number;
        };
      }>
    >('GET', endpoint);

    return {
      client_invoices: response.client_invoices,
      meta: response.meta,
    };
  }

  /**
   * Récupère une facture client par ID
   */
  async getClientInvoiceById(invoiceId: string): Promise<QontoClientInvoice> {
    const response = await this.request<
      QontoApiResponse<{ client_invoice: QontoClientInvoice }>
    >('GET', `/v2/client_invoices/${invoiceId}`);
    return response.client_invoice;
  }

  /**
   * Crée une nouvelle facture client
   * Doc: https://docs.qonto.com/api-reference/business-api/expense-management/client-quotes-notes/client-invoices/create-a-client-invoice
   *
   * @param params Paramètres de la facture
   * @param idempotencyKey Clé unique pour éviter les doublons (optionnel, générée si non fournie)
   */
  async createClientInvoice(
    params: CreateClientInvoiceParams,
    idempotencyKey?: string
  ): Promise<QontoClientInvoice> {
    const key = idempotencyKey || generateIdempotencyKey();

    const response = await this.requestWithIdempotency<
      QontoApiResponse<{ client_invoice: QontoClientInvoice }>
    >(
      'POST',
      '/v2/client_invoices',
      {
        client_id: params.clientId,
        currency: params.currency || 'EUR',
        issue_date: params.issueDate,
        due_date: params.dueDate, // Corrigé: était payment_deadline
        payment_methods: {
          iban: params.paymentMethods.iban, // OBLIGATOIRE selon doc Qonto
        },
        performance_start_date: params.performanceStartDate,
        performance_end_date: params.performanceEndDate,
        purchase_order_number: params.purchaseOrderNumber,
        number: params.number, // Optionnel - Qonto génère si non fourni
        header: params.header,
        footer: params.footer,
        terms_and_conditions: params.termsAndConditions,
        items: params.items.map(item => ({
          title: item.title,
          description: item.description,
          quantity: item.quantity, // String décimal
          unit: item.unit || 'unit',
          unit_price: {
            // Objet avec value et currency
            value: item.unitPrice.value,
            currency: item.unitPrice.currency,
          },
          vat_rate: item.vatRate, // String décimal, ex: "0.20"
        })),
      },
      key
    );

    return response.client_invoice;
  }

  /**
   * Met à jour une facture client (brouillon uniquement)
   */
  async updateClientInvoice(
    invoiceId: string,
    params: Partial<CreateClientInvoiceParams>
  ): Promise<QontoClientInvoice> {
    const updateData: Record<string, unknown> = {};

    if (params.clientId) updateData.client_id = params.clientId;
    if (params.currency) updateData.currency = params.currency;
    if (params.issueDate) updateData.issue_date = params.issueDate;
    if (params.dueDate) updateData.due_date = params.dueDate;
    if (params.paymentMethods)
      updateData.payment_methods = { iban: params.paymentMethods.iban };
    if (params.performanceStartDate)
      updateData.performance_start_date = params.performanceStartDate;
    if (params.performanceEndDate)
      updateData.performance_end_date = params.performanceEndDate;
    if (params.purchaseOrderNumber)
      updateData.purchase_order_number = params.purchaseOrderNumber;
    if (params.number) updateData.number = params.number;
    if (params.header) updateData.header = params.header;
    if (params.footer) updateData.footer = params.footer;
    if (params.termsAndConditions)
      updateData.terms_and_conditions = params.termsAndConditions;
    if (params.items) {
      updateData.items = params.items.map(item => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'unit',
        unit_price: {
          value: item.unitPrice.value,
          currency: item.unitPrice.currency,
        },
        vat_rate: item.vatRate,
      }));
    }

    const response = await this.request<
      QontoApiResponse<{ client_invoice: QontoClientInvoice }>
    >('PATCH' as any, `/v2/client_invoices/${invoiceId}`, updateData);

    return response.client_invoice;
  }

  /**
   * Finalise une facture (draft → unpaid)
   */
  async finalizeClientInvoice(invoiceId: string): Promise<QontoClientInvoice> {
    const response = await this.request<
      QontoApiResponse<{ client_invoice: QontoClientInvoice }>
    >('POST', `/v2/client_invoices/${invoiceId}/finalize`);
    return response.client_invoice;
  }

  /**
   * Marque une facture comme payée
   */
  async markClientInvoiceAsPaid(
    invoiceId: string,
    paidAt?: string
  ): Promise<QontoClientInvoice> {
    const response = await this.request<
      QontoApiResponse<{ client_invoice: QontoClientInvoice }>
    >('POST', `/v2/client_invoices/${invoiceId}/mark_as_paid`, {
      paid_at: paidAt || new Date().toISOString().split('T')[0],
    });
    return response.client_invoice;
  }

  /**
   * Annule une facture (unpaid → canceled)
   * Note: Seules les factures non payées peuvent être annulées
   * La facture reste dans le système avec statut "canceled"
   */
  async cancelClientInvoice(invoiceId: string): Promise<QontoClientInvoice> {
    const response = await this.request<
      QontoApiResponse<{ client_invoice: QontoClientInvoice }>
    >('POST', `/v2/client_invoices/${invoiceId}/mark_as_canceled`);
    return response.client_invoice;
  }

  /**
   * Supprime une facture brouillon
   * Note: Seules les factures avec statut "draft" peuvent être supprimées
   * Les factures finalisées doivent être annulées, pas supprimées
   */
  async deleteClientInvoice(invoiceId: string): Promise<void> {
    await this.request<void>('DELETE', `/v2/client_invoices/${invoiceId}`);
  }

  /**
   * Envoie une facture par email
   */
  async sendClientInvoiceByEmail(
    invoiceId: string,
    emails: string[]
  ): Promise<void> {
    await this.request<void>('POST', `/v2/client_invoices/${invoiceId}/send`, {
      recipient_emails: emails,
    });
  }

  // ===================================================================
  // CLIENTS (Clients Qonto)
  // ===================================================================

  /**
   * Liste les clients
   */
  async getClients(params?: {
    perPage?: number;
    currentPage?: number;
  }): Promise<{
    clients: QontoClientEntity[];
    meta: { total_count: number };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.perPage)
      queryParams.append('per_page', params.perPage.toString());
    if (params?.currentPage)
      queryParams.append('page', params.currentPage.toString());

    const endpoint = `/v2/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await this.request<
      QontoApiResponse<{
        clients: QontoClientEntity[];
        meta: { total_count: number };
      }>
    >('GET', endpoint);

    return {
      clients: response.clients,
      meta: response.meta,
    };
  }

  /**
   * Récupère un client par ID
   */
  async getClientById(clientId: string): Promise<QontoClientEntity> {
    const response = await this.request<
      QontoApiResponse<{ client: QontoClientEntity }>
    >('GET', `/v2/clients/${clientId}`);
    return response.client;
  }

  /**
   * Crée un nouveau client
   */
  async createClient(params: CreateClientParams): Promise<QontoClientEntity> {
    const response = await this.request<
      QontoApiResponse<{ client: QontoClientEntity }>
    >('POST', '/v2/clients', {
      name: params.name,
      type: params.type, // Required by Qonto API ('company' | 'individual')
      email: params.email,
      currency: params.currency || 'EUR',
      vat_number: params.vatNumber,
      // billing_address est le champ requis pour la facturation
      billing_address: params.address
        ? {
            street_address: params.address.streetAddress,
            city: params.address.city,
            zip_code: params.address.zipCode,
            country_code: params.address.countryCode,
          }
        : undefined,
      phone: params.phone,
      locale: params.locale || 'fr',
    });

    return response.client;
  }

  /**
   * Met à jour un client existant
   */
  async updateClient(
    clientId: string,
    params: Partial<CreateClientParams>
  ): Promise<QontoClientEntity> {
    const response = await this.request<
      QontoApiResponse<{ client: QontoClientEntity }>
    >('PATCH', `/v2/clients/${clientId}`, {
      name: params.name,
      type: params.type,
      email: params.email,
      currency: params.currency,
      vat_number: params.vatNumber,
      billing_address: params.address
        ? {
            street_address: params.address.streetAddress,
            city: params.address.city,
            zip_code: params.address.zipCode,
            country_code: params.address.countryCode,
          }
        : undefined,
      phone: params.phone,
      locale: params.locale,
    });

    return response.client;
  }

  /**
   * Recherche un client par email ou numéro TVA
   */
  async findClientByEmail(email: string): Promise<QontoClientEntity | null> {
    const { clients } = await this.getClients({ perPage: 100 });
    return clients.find(c => c.email === email) || null;
  }

  async findClientByVatNumber(
    vatNumber: string
  ): Promise<QontoClientEntity | null> {
    const { clients } = await this.getClients({ perPage: 100 });
    return clients.find(c => c.vat_number === vatNumber) || null;
  }

  // ===================================================================
  // ATTACHMENTS (Pièces jointes)
  // Doc: https://docs.qonto.com/api-reference/business-api/expense-management/attachments-in-transactions/upload-an-attachment-to-a-transaction
  // ===================================================================

  /**
   * Upload une pièce jointe DIRECTEMENT sur une transaction (RECOMMANDÉ)
   * C'est le flow correct selon la doc Qonto: multipart + idempotency
   *
   * @param transactionId ID de la transaction
   * @param file Fichier (JPEG, PNG ou PDF)
   * @param filename Nom du fichier
   * @param idempotencyKey Clé unique pour éviter les doublons
   */
  async uploadAttachmentToTransaction(
    transactionId: string,
    file: Blob | File,
    filename: string,
    idempotencyKey?: string
  ): Promise<QontoAttachment> {
    const key = idempotencyKey || generateIdempotencyKey();
    const formData = new FormData();
    formData.append('file', file, filename);

    const url = `${this.baseUrl}/v2/transactions/${transactionId}/attachments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'X-Qonto-Idempotency-Key': key,
      },
      body: formData,
    });

    // Log response details for debugging
    console.log('[QontoClient] uploadAttachmentToTransaction response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createErrorFromResponse(response.status, errorData);
    }

    // Handle 204 No Content or empty response - fetch real attachment ID
    const responseText = await response.text();
    console.log('[QontoClient] Response body:', responseText);

    const needsAttachmentFetch =
      response.status === 204 ||
      !responseText ||
      responseText.trim() === '' ||
      responseText.trim() === '{}';

    if (needsAttachmentFetch) {
      console.warn(
        '[QontoClient] Upload succeeded but no attachment ID in response. Fetching real ID...'
      );

      // Fetch the transaction attachments to get the real ID
      try {
        const attachments = await this.getTransactionAttachments(transactionId);

        if (attachments.length > 0) {
          // Return the latest attachment (the one we just uploaded)
          const latestAttachment = attachments[attachments.length - 1];
          console.log(
            '[QontoClient] Found real attachment ID:',
            latestAttachment.id
          );
          return latestAttachment;
        }

        // No attachments found - this shouldn't happen after successful upload
        throw new QontoError(
          'Upload réussi mais aucun attachment trouvé sur la transaction Qonto',
          'NOT_FOUND',
          200
        );
      } catch (fetchError) {
        // If it's already a QontoError, rethrow it
        if (fetchError instanceof QontoError) {
          throw fetchError;
        }
        console.error(
          '[QontoClient] Failed to fetch attachment after upload:',
          fetchError
        );
        throw new QontoError(
          "Upload réussi mais impossible de récupérer l'ID de l'attachment",
          'UNKNOWN_ERROR',
          200,
          { originalError: fetchError }
        );
      }
    }

    const data = JSON.parse(responseText);

    // Validate response structure - Qonto should return { attachment: { id, ... } }
    if (!data.attachment) {
      console.error(
        '[QontoClient] uploadAttachmentToTransaction: unexpected response:',
        JSON.stringify(data, null, 2)
      );
      throw new QontoError(
        `Réponse API Qonto inattendue: pas de champ 'attachment'`,
        'VALIDATION_ERROR',
        response.status,
        data
      );
    }

    return data.attachment;
  }

  /**
   * Upload une pièce jointe générique (pour external transfers uniquement)
   * @deprecated Préférer uploadAttachmentToTransaction pour les transactions
   */
  async uploadAttachment(
    file: Blob | File,
    filename: string,
    idempotencyKey?: string
  ): Promise<QontoAttachment> {
    const key = idempotencyKey || generateIdempotencyKey();
    const formData = new FormData();
    formData.append('file', file, filename);

    const url = `${this.baseUrl}/v2/attachments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'X-Qonto-Idempotency-Key': key,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createErrorFromResponse(response.status, errorData);
    }

    const data = await response.json();
    return data.attachment;
  }

  /**
   * Récupère l'URL d'une pièce jointe (valide 30 minutes)
   */
  async getAttachmentUrl(attachmentId: string): Promise<string> {
    const response = await this.request<
      QontoApiResponse<{ attachment: QontoAttachment }>
    >('GET', `/v2/attachments/${attachmentId}`);
    return response.attachment.url;
  }

  /**
   * Liste les pièces jointes d'une transaction
   */
  async getTransactionAttachments(
    transactionId: string
  ): Promise<QontoAttachment[]> {
    const response = await this.request<
      QontoApiResponse<{ attachments: QontoAttachment[] }>
    >('GET', `/v2/transactions/${transactionId}/attachments`);
    return response.attachments;
  }

  /**
   * Supprime les pièces jointes d'une transaction
   */
  async removeTransactionAttachments(transactionId: string): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/v2/transactions/${transactionId}/attachments`
    );
  }

  /**
   * Remove a single attachment from a transaction
   * @param transactionId - Qonto transaction UUID
   * @param attachmentId - Qonto attachment UUID
   */
  async removeSingleAttachment(
    transactionId: string,
    attachmentId: string
  ): Promise<void> {
    await this.request<void>(
      'DELETE',
      `/v2/transactions/${transactionId}/attachments/${attachmentId}`
    );
  }

  // ===================================================================
  // SUPPLIER INVOICES (Factures fournisseurs)
  // Doc: https://docs.qonto.com/api-reference/business-api/expense-management/supplier-invoices/create-supplier-invoices
  // ===================================================================

  /**
   * Upload en masse de factures fournisseurs
   * Endpoint: POST /v2/supplier_invoices/bulk (multipart/form-data)
   *
   * @param invoices Liste des factures à uploader (fichier + idempotency key)
   * @returns Résultat avec factures créées et erreurs éventuelles
   */
  async uploadSupplierInvoicesBulk(
    invoices: UploadSupplierInvoiceParams[]
  ): Promise<UploadSupplierInvoicesResult> {
    const formData = new FormData();

    invoices.forEach((invoice, index) => {
      // Format Qonto: supplier_invoices[][file] et supplier_invoices[][idempotency_key]
      formData.append(`supplier_invoices[${index}][file]`, invoice.file);
      formData.append(
        `supplier_invoices[${index}][idempotency_key]`,
        invoice.idempotencyKey
      );
    });

    const url = `${this.baseUrl}/v2/supplier_invoices/bulk`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
      },
      body: formData,
    });

    // Note: Cet endpoint retourne toujours 200, vérifier le champ errors
    const data = await response.json();

    if (!response.ok) {
      throw this.createErrorFromResponse(response.status, data);
    }

    return {
      supplier_invoices: data.supplier_invoices || [],
      errors: data.errors || [],
    };
  }

  /**
   * Upload d'une seule facture fournisseur (wrapper simplifié)
   */
  async uploadSupplierInvoice(
    file: Blob | File,
    idempotencyKey?: string
  ): Promise<UploadSupplierInvoicesResult> {
    return this.uploadSupplierInvoicesBulk([
      {
        file,
        idempotencyKey: idempotencyKey || generateIdempotencyKey(),
      },
    ]);
  }

  // ===================================================================
  // LABELS (Étiquettes)
  // ===================================================================

  /**
   * Liste les labels de l'organisation
   */
  async getLabels(): Promise<QontoLabel[]> {
    const response = await this.request<
      QontoApiResponse<{ labels: QontoLabel[] }>
    >('GET', '/v2/labels');
    return response.labels;
  }

  /**
   * Récupère un label par ID
   */
  async getLabelById(labelId: string): Promise<QontoLabel> {
    const response = await this.request<
      QontoApiResponse<{ label: QontoLabel }>
    >('GET', `/v2/labels/${labelId}`);
    return response.label;
  }

  /**
   * Met à jour les labels d'une transaction
   */
  async updateTransactionLabels(
    transactionId: string,
    labelIds: string[]
  ): Promise<void> {
    await this.request<void>(
      'PUT',
      `/v2/transactions/${transactionId}/labels`,
      { label_ids: labelIds }
    );
  }

  // ===================================================================
  // HELPERS
  // ===================================================================

  private createErrorFromResponse(status: number, data: any): QontoError {
    const message =
      data?.message || data?.error || `Qonto API error (${status})`;

    switch (status) {
      case 400:
        return new QontoError(message, 'VALIDATION_ERROR', status, data);
      case 401:
        return new QontoError(
          'Invalid Qonto credentials',
          'AUTH_ERROR',
          status,
          data
        );
      case 403:
        return new QontoError(
          'Insufficient Qonto permissions',
          'PERMISSION_ERROR',
          status,
          data
        );
      case 404:
        return new QontoError('Resource not found', 'NOT_FOUND', status, data);
      case 429:
        return new QontoError(
          'Qonto rate limit exceeded',
          'RATE_LIMIT',
          status,
          data
        );
      case 500:
      case 502:
      case 503:
        return new QontoError(
          'Qonto server error',
          'SERVER_ERROR',
          status,
          data
        );
      default:
        return new QontoError(message, 'UNKNOWN_ERROR', status, data);
    }
  }

  private shouldRetry(error: QontoError): boolean {
    // Retry sur timeout, network errors, et server errors
    return (
      error.code === 'TIMEOUT' ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'SERVER_ERROR' ||
      error.code === 'RATE_LIMIT'
    );
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return this.config.retryDelay * Math.pow(2, retryCount);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===================================================================
// SINGLETON INSTANCE
// ===================================================================

let qontoClient: QontoClient | null = null;

export function getQontoClient(): QontoClient {
  if (!qontoClient) {
    qontoClient = new QontoClient();
  }
  return qontoClient;
}
