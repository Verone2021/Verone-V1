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
} from './types';

// =====================================================================
// CLIENT
// =====================================================================

export class QontoClient {
  private config: QontoConfig;
  private baseUrl: string;

  constructor(config?: Partial<QontoConfig>) {
    this.config = {
      organizationId:
        config?.organizationId || process.env.QONTO_ORGANIZATION_ID!,
      apiKey: config?.apiKey || process.env.QONTO_API_KEY!,
      baseUrl:
        config?.baseUrl ||
        process.env.QONTO_API_BASE_URL ||
        'https://thirdparty.qonto.com',
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
    };

    this.baseUrl = this.config.baseUrl!;

    if (!this.config.organizationId || !this.config.apiKey) {
      throw new Error(
        'Qonto credentials missing (QONTO_ORGANIZATION_ID or QONTO_API_KEY)'
      );
    }
  }

  // ===================================================================
  // HTTP REQUEST WITH RETRY
  // ===================================================================

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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
          Authorization: `${this.config.organizationId}:${this.config.apiKey}`,
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
      if (this.shouldRetry(error) && retryCount < this.config.maxRetries!) {
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

        if (retryCount < this.config.maxRetries!) {
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
      queryParams.append('current_page', params.currentPage.toString());

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
    return this.config.retryDelay! * Math.pow(2, retryCount);
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
