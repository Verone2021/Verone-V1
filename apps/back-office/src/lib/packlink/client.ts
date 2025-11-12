/**
 * Packlink API Client
 * Documentation: https://github.com/wout/packlink.cr
 * Date: 2025-11-12
 */

import {
  PacklinkError,
  PacklinkRequestTimeoutError,
  PacklinkRateLimitError,
  parsePacklinkError,
} from './errors';
import { getGlobalRateLimiter } from './rate-limiter';
import type {
  PacklinkClientConfig,
  PacklinkService,
  PacklinkOrderRequest,
  PacklinkOrderResponse,
  PacklinkShipmentDetails,
  PacklinkTrackingEvent,
  PacklinkLabel,
  PacklinkDropoff,
  PacklinkAddress,
  PacklinkPackage,
} from './types';

/**
 * Packlink API Client
 */
export class PacklinkClient {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: PacklinkClientConfig) {
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000; // 30s default
    this.maxRetries = config.maxRetries ?? 3;

    // Base URL selon environnement
    this.baseURL =
      config.environment === 'sandbox'
        ? 'https://apisandbox.packlink.com/v1'
        : 'https://api.packlink.com/v1';
  }

  /**
   * Make HTTP request to Packlink API with rate limiting & retry
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    retryCount = 0
  ): Promise<T> {
    // Rate limiting (wait for token)
    const rateLimiter = getGlobalRateLimiter();
    await rateLimiter.waitForToken();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.apiKey, // ⚠️ PAS "Bearer", juste la clé
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Retry on 429 (rate limit) with exponential backoff
        if (response.status === 429 && retryCount < this.maxRetries) {
          const retryAfter = parseInt(
            response.headers.get('Retry-After') ?? '5',
            10
          );
          const backoffMs = Math.min(1000 * 2 ** retryCount, retryAfter * 1000);

          await new Promise(resolve => setTimeout(resolve, backoffMs));
          return this.request<T>(method, endpoint, body, retryCount + 1);
        }

        // Retry on 5xx server errors
        if (response.status >= 500 && retryCount < this.maxRetries) {
          const backoffMs = 1000 * 2 ** retryCount; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          return this.request<T>(method, endpoint, body, retryCount + 1);
        }

        throw parsePacklinkError(errorData, response.status);
      }

      // Parse response
      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Abort error = timeout
      if ((error as Error).name === 'AbortError') {
        throw new PacklinkRequestTimeoutError(
          `Request to ${endpoint} timed out after ${this.timeout}ms`
        );
      }

      throw parsePacklinkError(error);
    }
  }

  /**
   * 1. SEARCH SERVICES
   * POST /services
   * Recherche transporteurs disponibles avec prix
   */
  async searchServices(params: {
    from: { country: string; zip: string };
    to: { country: string; zip: string };
    packages: PacklinkPackage[];
  }): Promise<PacklinkService[]> {
    // Format packages for API (indexed object)
    const packagesFormatted = params.packages.reduce(
      (acc, pkg, index) => {
        acc[index.toString()] = pkg;
        return acc;
      },
      {} as Record<string, PacklinkPackage>
    );

    const response = await this.request<{ services: PacklinkService[] }>(
      'POST',
      '/services',
      {
        from: params.from,
        to: params.to,
        packages: packagesFormatted,
      }
    );

    return response.services || [];
  }

  /**
   * 2. CREATE ORDER
   * POST /orders
   * Créer expédition(s) avec tracking
   */
  async createOrder(
    order: PacklinkOrderRequest
  ): Promise<PacklinkOrderResponse> {
    const response = await this.request<PacklinkOrderResponse>(
      'POST',
      '/orders',
      order
    );
    return response;
  }

  /**
   * 3. GET LABELS
   * GET /labels?shipment_reference={ref}
   * Récupérer URLs étiquettes PDF
   */
  async getLabels(shipmentReference: string): Promise<PacklinkLabel[]> {
    const response = await this.request<PacklinkLabel[]>(
      'GET',
      `/labels?shipment_reference=${encodeURIComponent(shipmentReference)}`
    );
    return response;
  }

  /**
   * 4. GET SHIPMENT DETAILS
   * GET /shipments/{ref}
   * Détails complets expédition
   */
  async getShipment(
    shipmentReference: string
  ): Promise<PacklinkShipmentDetails> {
    const response = await this.request<PacklinkShipmentDetails>(
      'GET',
      `/shipments/${encodeURIComponent(shipmentReference)}`
    );
    return response;
  }

  /**
   * 5. GET TRACKING HISTORY
   * GET /shipments/{ref}/track
   * Historique tracking événements
   */
  async getTracking(
    shipmentReference: string
  ): Promise<PacklinkTrackingEvent[]> {
    const response = await this.request<{ tracking: PacklinkTrackingEvent[] }>(
      'GET',
      `/shipments/${encodeURIComponent(shipmentReference)}/track`
    );
    return response.tracking || [];
  }

  /**
   * 6. GET DROPOFF POINTS
   * GET /dropoffs
   * Trouver points de dépôt proches
   */
  async getDropoffs(params: {
    service_id: number;
    country: string;
    zip: string;
  }): Promise<PacklinkDropoff[]> {
    const queryParams = new URLSearchParams({
      service_id: params.service_id.toString(),
      country: params.country,
      zip: params.zip,
    });

    const response = await this.request<PacklinkDropoff[]>(
      'GET',
      `/dropoffs?${queryParams.toString()}`
    );
    return response;
  }

  /**
   * 7. REGISTER WEBHOOK
   * POST /callback/register
   * Configurer URL webhook pour événements
   */
  async registerWebhook(url: string, secret?: string): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>('POST', '/callback/register', {
        url,
        ...(secret && { secret }),
      });
      return true;
    } catch (error) {
      console.error('Failed to register Packlink webhook:', error);
      return false;
    }
  }

  /**
   * 8. CREATE DRAFT SHIPMENT
   * POST /drafts
   * Créer brouillon expédition (tous champs optionnels)
   */
  async createDraft(params: {
    from?: PacklinkAddress;
    to?: PacklinkAddress;
    packages?: PacklinkPackage[];
    service_id?: number;
    content?: string;
    contentvalue?: number;
  }): Promise<{ shipment_reference: string }> {
    const response = await this.request<{ shipment_reference: string }>(
      'POST',
      '/drafts',
      params
    );
    return response;
  }

  /**
   * 9. GET CUSTOMS PDF
   * GET /customs/pdf/{ref}
   * Récupérer document douane (expéditions hors UE)
   */
  async getCustomsPdf(shipmentReference: string): Promise<string> {
    const response = await this.request<string>(
      'GET',
      `/customs/pdf/${encodeURIComponent(shipmentReference)}`
    );
    return response; // URL PDF
  }
}

/**
 * Create Packlink client instance from environment variables
 */
export function createPacklinkClient(): PacklinkClient {
  const apiKey = process.env.PACKLINK_API_KEY;
  if (!apiKey) {
    throw new Error('PACKLINK_API_KEY environment variable is required');
  }

  const environment =
    process.env.PACKLINK_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';

  return new PacklinkClient({
    apiKey,
    environment,
    timeout: 30000, // 30s
    maxRetries: 3,
  });
}

/**
 * Singleton instance (lazy-loaded)
 */
let singletonClient: PacklinkClient | null = null;

/**
 * Get shared Packlink client instance
 */
export function getPacklinkClient(): PacklinkClient {
  if (!singletonClient) {
    singletonClient = createPacklinkClient();
  }
  return singletonClient;
}
