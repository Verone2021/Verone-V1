// =====================================================================
// Client Abby API
// Date: 2025-10-11
// Description: Client HTTP type-safe pour intégration Abby.fr
// =====================================================================

import type {
  AbbyClientConfig,
  AbbyCustomer,
  CreateCustomerPayload,
  AbbyInvoice,
  CreateInvoicePayload,
  AddInvoiceLinePayload,
  AbbyApiResponse,
} from './types';

import {
  AbbyError,
  AbbyNetworkError,
  AbbyTimeoutError,
  AbbyRetryExhaustedError,
  createAbbyErrorFromResponse,
  shouldRetryError,
} from './errors';

// =====================================================================
// CONFIGURATION PAR DÉFAUT
// =====================================================================

const DEFAULT_CONFIG: Partial<AbbyClientConfig> = {
  timeout: 10000, // 10 secondes
  maxRetries: 3,
  retryDelay: 1000, // 1 seconde initiale
};

// =====================================================================
// CLIENT ABBY
// =====================================================================

export class AbbyClient {
  private readonly config: AbbyClientConfig;

  constructor(config: AbbyClientConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Validation config
    if (!this.config.apiKey) {
      throw new AbbyError('API key is required', 'MISSING_API_KEY');
    }
    if (!this.config.baseUrl) {
      throw new AbbyError('Base URL is required', 'MISSING_BASE_URL');
    }
    if (!this.config.companyId) {
      throw new AbbyError('Company ID is required', 'MISSING_COMPANY_ID');
    }
  }

  // ===================================================================
  // PRIVATE: HTTP REQUEST AVEC RETRY LOGIC
  // ===================================================================

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options: { retryCount?: number } = {}
  ): Promise<T> {
    const { retryCount = 0 } = options;
    const url = `${this.config.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Success (2xx)
      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      // Error (4xx, 5xx)
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const error = createAbbyErrorFromResponse(response.status, errorData);

      // Retry logic
      if (shouldRetryError(error) && retryCount < this.config.maxRetries!) {
        const delay = this.calculateRetryDelay(retryCount);
        console.warn(
          `Abby API: Retry ${retryCount + 1}/${this.config.maxRetries} after ${delay}ms. Error: ${error.message}`
        );

        await this.sleep(delay);
        return this.request<T>(method, endpoint, body, {
          retryCount: retryCount + 1,
        });
      }

      throw error;
    } catch (err) {
      clearTimeout(timeoutId);

      // Timeout error
      if (err instanceof DOMException && err.name === 'AbortError') {
        const timeoutError = new AbbyTimeoutError(this.config.timeout!);

        if (retryCount < this.config.maxRetries!) {
          const delay = this.calculateRetryDelay(retryCount);
          console.warn(
            `Abby API: Timeout retry ${retryCount + 1}/${this.config.maxRetries} after ${delay}ms`
          );

          await this.sleep(delay);
          return this.request<T>(method, endpoint, body, {
            retryCount: retryCount + 1,
          });
        }

        throw new AbbyRetryExhaustedError(retryCount + 1, timeoutError);
      }

      // Network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        const networkError = new AbbyNetworkError(err.message, err);

        if (retryCount < this.config.maxRetries!) {
          const delay = this.calculateRetryDelay(retryCount);
          console.warn(
            `Abby API: Network retry ${retryCount + 1}/${this.config.maxRetries} after ${delay}ms`
          );

          await this.sleep(delay);
          return this.request<T>(method, endpoint, body, {
            retryCount: retryCount + 1,
          });
        }

        throw new AbbyRetryExhaustedError(retryCount + 1, networkError);
      }

      // AbbyError déjà levée (retry exhausted ou non-retryable)
      if (err instanceof AbbyError) {
        throw err;
      }

      // Unknown error
      throw new AbbyError(
        `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`,
        'ABBY_UNKNOWN_ERROR'
      );
    }
  }

  // ===================================================================
  // PRIVATE: EXPONENTIAL BACKOFF CALCULATION
  // ===================================================================

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    return this.config.retryDelay! * Math.pow(2, retryCount);
  }

  // ===================================================================
  // PRIVATE: SLEEP HELPER
  // ===================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ===================================================================
  // CUSTOMERS API
  // ===================================================================

  /**
   * Récupérer liste clients
   */
  async getCustomers(): Promise<AbbyCustomer[]> {
    const response = await this.request<{ data: AbbyCustomer[] }>(
      'GET',
      '/contacts'
    );
    return response.data;
  }

  /**
   * Créer nouveau client Abby
   */
  async createCustomer(
    payload: CreateCustomerPayload
  ): Promise<AbbyCustomer> {
    const response = await this.request<{ data: AbbyCustomer }>(
      'POST',
      '/customers',
      payload
    );
    return response.data;
  }

  /**
   * Récupérer client par ID
   */
  async getCustomer(customerId: string): Promise<AbbyCustomer> {
    const response = await this.request<{ data: AbbyCustomer }>(
      'GET',
      `/customers/${customerId}`
    );
    return response.data;
  }

  // ===================================================================
  // INVOICES API
  // ===================================================================

  /**
   * Créer facture brouillon (sans lignes)
   */
  async createInvoice(payload: CreateInvoicePayload): Promise<AbbyInvoice> {
    const response = await this.request<{ data: AbbyInvoice }>(
      'POST',
      `/v2/billing/invoice/${payload.customerId}`,
      {
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        reference: payload.reference,
      }
    );
    return response.data;
  }

  /**
   * Ajouter ligne facture
   */
  async addInvoiceLine(
    billingId: string,
    line: AddInvoiceLinePayload
  ): Promise<void> {
    await this.request<void>('POST', `/v2/billing/${billingId}/lines`, line);
  }

  /**
   * Finaliser facture (passer en "sent")
   */
  async finalizeInvoice(billingId: string): Promise<AbbyInvoice> {
    const response = await this.request<{ data: AbbyInvoice }>(
      'PUT',
      `/v2/billing/${billingId}`,
      { status: 'sent' }
    );
    return response.data;
  }

  /**
   * Récupérer facture par ID
   */
  async getInvoice(billingId: string): Promise<AbbyInvoice> {
    const response = await this.request<{ data: AbbyInvoice }>(
      'GET',
      `/v2/billing/${billingId}`
    );
    return response.data;
  }

  /**
   * Workflow complet: Créer facture avec lignes et finaliser
   */
  async createCompleteInvoice(
    payload: CreateInvoicePayload
  ): Promise<AbbyInvoice> {
    // 1. Créer brouillon
    const invoice = await this.createInvoice(payload);

    // 2. Ajouter lignes si fournies
    if (payload.lines && payload.lines.length > 0) {
      for (const line of payload.lines) {
        await this.addInvoiceLine(invoice.id, line);
      }
    }

    // 3. Finaliser facture
    const finalizedInvoice = await this.finalizeInvoice(invoice.id);

    return finalizedInvoice;
  }
}

// ===================================================================
// SINGLETON INSTANCE (CONFIGURATION DEPUIS ENV)
// ===================================================================

let abbyClientInstance: AbbyClient | null = null;

export function getAbbyClient(): AbbyClient {
  if (!abbyClientInstance) {
    const apiKey = process.env.ABBY_API_KEY;
    const baseUrl = process.env.ABBY_API_BASE_URL;
    const companyId = process.env.ABBY_COMPANY_ID;

    if (!apiKey || !baseUrl || !companyId) {
      throw new AbbyError(
        'Missing Abby API configuration in environment variables',
        'MISSING_CONFIG'
      );
    }

    abbyClientInstance = new AbbyClient({
      apiKey,
      baseUrl,
      companyId,
    });
  }

  return abbyClientInstance;
}

// ===================================================================
// EXPORT DEFAULT CLIENT
// ===================================================================

export default AbbyClient;
