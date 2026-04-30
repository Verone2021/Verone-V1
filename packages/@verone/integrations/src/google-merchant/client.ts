/**
 * 🛒 Google Merchant Center API Client
 *
 * Client principal pour interagir avec l'API Google Merchant Center
 * Utilise l'authentification Service Account et les transformers
 */

import type { GoogleMerchantAuth } from './auth';
import { getGoogleMerchantAuth } from './auth';
import { GOOGLE_MERCHANT_CONFIG, getResourcePaths } from './config';
import {
  mapSupabaseToGoogleMerchant,
  type ProductWithRelations,
} from './product-mapper';

// Types de réponse Google Merchant API
interface GoogleMerchantApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

interface ProductInputResponse {
  name: string;
  product: string;
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes: Record<string, unknown>;
}

interface GoogleApiErrorResponse {
  error?: {
    message?: string;
  };
}

// Produit input pour le client (données brutes de la DB)
interface ProductData {
  sku: string;
  slug?: string;
  name: string;
  description?: string;
  technical_description?: string;
  price_ht: number;
  cost_price?: number;
  status: string;
  condition?: string;
  manufacturer?: string;
  gtin?: string;
  supplier_reference?: string;
  variant_attributes?: Record<string, unknown>;
  selling_points?: string[];
  weight?: number;
  dimensions?: Record<string, unknown>;
  item_group_id?: string;
  images?: Array<{
    public_url: string;
    is_primary: boolean;
    alt_text?: string;
    display_order: number;
  }>;
  supplier?: {
    name: string;
    id: string;
  };
  subcategory?: {
    name: string;
    google_category?: string;
  };
}

// ProductInsertRequest supprimé - Format SDK non utilisé pour REST API

/**
 * Client principal Google Merchant Center
 */
export class GoogleMerchantClient {
  private auth: GoogleMerchantAuth;
  private baseUrl: string;
  private accountId: string;
  private dataSourcePath: string;

  constructor() {
    this.auth = getGoogleMerchantAuth();
    this.baseUrl = GOOGLE_MERCHANT_CONFIG.baseUrl;
    this.accountId = GOOGLE_MERCHANT_CONFIG.accountId;
    this.dataSourcePath = getResourcePaths().dataSource;

    console.warn('[Google Merchant Client] Initialized:', {
      accountId: this.accountId,
      dataSource: this.dataSourcePath,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Effectue une requête HTTP vers l'API Google Merchant
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<GoogleMerchantApiResponse<T>> {
    try {
      const headers = await this.auth.getAuthHeaders();
      const url = `${this.baseUrl}/${endpoint}`;

      console.warn(`[Google Merchant Client] ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      // Log raw response for debugging
      const responseText = await response.text();
      console.warn(
        `[Google Merchant Client] Response status: ${response.status}`
      );
      console.warn(
        `[Google Merchant Client] Response headers:`,
        Object.fromEntries(response.headers.entries())
      );
      console.warn(
        `[Google Merchant Client] Response body (first 500 chars):`,
        responseText.substring(0, 500)
      );

      // Parse JSON response
      let responseData: unknown;
      try {
        responseData = JSON.parse(responseText);
      } catch (_parseError) {
        console.error('[Google Merchant Client] Failed to parse JSON response');
        return {
          success: false,
          error: `Invalid JSON response from Google API (Status ${response.status}): ${responseText.substring(0, 200)}`,
          details: { status: response.status, body: responseText },
        };
      }

      if (!response.ok) {
        const errorResponse = responseData as GoogleApiErrorResponse;
        console.error('[Google Merchant Client] API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });

        return {
          success: false,
          error: `API Error ${response.status}: ${errorResponse.error?.message ?? response.statusText}`,
          details: responseData,
        };
      }

      console.warn('[Google Merchant Client] API Success:', {
        endpoint,
        status: response.status,
      });

      return {
        success: true,
        data: responseData as T,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('[Google Merchant Client] Request failed:', error);
      return {
        success: false,
        error: `Network error: ${errorMessage}`,
        details: error,
      };
    }
  }

  /**
   * Insère un produit dans Google Merchant Center
   */
  async insertProduct(
    productData: ProductData
  ): Promise<GoogleMerchantApiResponse<ProductInputResponse>> {
    try {
      // 1. Mapper le produit vers le format Google Merchant v1 (format plat)
      const mappedProduct = mapSupabaseToGoogleMerchant(
        productData as unknown as ProductWithRelations
      );

      // 2. Construire l'endpoint (Merchant API v1)
      const endpoint = `products/${GOOGLE_MERCHANT_CONFIG.apiVersion}/accounts/${this.accountId}/productInputs:insert?dataSource=${encodeURIComponent(this.dataSourcePath)}`;

      // 3. Envoyer le ProductInput directement (format plat, pas de wrapper)
      const result = await this.makeRequest<ProductInputResponse>(
        endpoint,
        'POST',
        mappedProduct
      );

      if (result.success) {
        console.warn(
          '[Google Merchant Client] Product inserted successfully:',
          {
            sku: productData.sku,
            googleProductId: result.data?.name,
          }
        );
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('[Google Merchant Client] Insert product failed:', error);
      return {
        success: false,
        error: `Insert failed: ${errorMessage}`,
        details: error,
      };
    }
  }

  /**
   * Met à jour un produit existant dans Google Merchant Center
   */
  async updateProduct(
    productData: ProductData
  ): Promise<GoogleMerchantApiResponse<ProductInputResponse>> {
    try {
      // Pour Google Merchant API, la mise à jour se fait via une nouvelle insertion
      // qui écrase automatiquement le produit existant avec le même offerId
      const result = await this.insertProduct(productData);

      if (result.success) {
        console.warn('[Google Merchant Client] Product updated successfully:', {
          sku: productData.sku,
        });
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('[Google Merchant Client] Update product failed:', error);
      return {
        success: false,
        error: `Update failed: ${errorMessage}`,
        details: error,
      };
    }
  }

  /**
   * Supprime un produit de Google Merchant Center
   */
  async deleteProduct(sku: string): Promise<GoogleMerchantApiResponse> {
    try {
      const productInputName = `${getResourcePaths().productInputs}/${GOOGLE_MERCHANT_CONFIG.contentLanguage}~${GOOGLE_MERCHANT_CONFIG.feedLabel}~${sku}`;

      const result = await this.makeRequest(productInputName, 'DELETE');

      if (result.success) {
        console.warn('[Google Merchant Client] Product deleted successfully:', {
          sku,
        });
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('[Google Merchant Client] Delete product failed:', error);
      return {
        success: false,
        error: `Delete failed: ${errorMessage}`,
        details: error,
      };
    }
  }

  /**
   * Récupère un produit depuis Google Merchant Center
   */
  async getProduct(sku: string): Promise<GoogleMerchantApiResponse> {
    try {
      const productName = `${getResourcePaths().products}/${GOOGLE_MERCHANT_CONFIG.contentLanguage}~${GOOGLE_MERCHANT_CONFIG.feedLabel}~${sku}`;

      return await this.makeRequest(productName, 'GET');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('[Google Merchant Client] Get product failed:', error);
      return {
        success: false,
        error: `Get failed: ${errorMessage}`,
        details: error,
      };
    }
  }

  /**
   * Liste les produits dans Google Merchant Center (avec pagination)
   */
  async listProducts(
    pageSize = 100,
    pageToken?: string
  ): Promise<GoogleMerchantApiResponse> {
    try {
      let endpoint = `${getResourcePaths().products}?pageSize=${pageSize}`;
      if (pageToken) {
        endpoint += `&pageToken=${pageToken}`;
      }

      return await this.makeRequest(endpoint, 'GET');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('[Google Merchant Client] List products failed:', error);
      return {
        success: false,
        error: `List failed: ${errorMessage}`,
        details: error,
      };
    }
  }

  /**
   * Synchronise un lot de produits (batch operation)
   */
  async batchSyncProducts(
    products: ProductData[]
  ): Promise<GoogleMerchantApiResponse[]> {
    console.warn(
      `[Google Merchant Client] Batch syncing ${products.length} products`
    );

    const results: GoogleMerchantApiResponse[] = [];
    const batchSize = GOOGLE_MERCHANT_CONFIG.rateLimit.batchSize;

    // Traitement par batch pour respecter les rate limits
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      console.warn(
        `[Google Merchant Client] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`
      );

      // Traitement séquentiel pour éviter les rate limits
      for (const product of batch) {
        const result = await this.insertProduct(product);
        results.push(result);

        // Pause entre les requêtes pour respecter les rate limits
        if (GOOGLE_MERCHANT_CONFIG.rateLimit.requestsPerSecond > 0) {
          await new Promise(resolve =>
            setTimeout(
              resolve,
              1000 / GOOGLE_MERCHANT_CONFIG.rateLimit.requestsPerSecond
            )
          );
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.warn(
      `[Google Merchant Client] Batch sync completed: ${successCount} success, ${errorCount} errors`
    );

    return results;
  }

  /**
   * Teste la connectivité avec l'API Google Merchant Center
   */
  async testConnection(): Promise<GoogleMerchantApiResponse> {
    try {
      console.warn('[Google Merchant Client] Testing connection...');

      // Test d'authentification
      const authTest = await this.auth.testAuthentication();
      if (!authTest) {
        return {
          success: false,
          error: 'Authentication failed',
        };
      }

      // Test de l'API en listant les produits
      const listResult = await this.listProducts(1);

      if (listResult.success) {
        console.warn('[Google Merchant Client] Connection test: ✅ Success');
        return {
          success: true,
          data: { message: 'Connection successful', auth: true, api: true },
        };
      } else {
        console.warn('[Google Merchant Client] Connection test: ❌ API Failed');
        return listResult;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('[Google Merchant Client] Connection test failed:', error);
      return {
        success: false,
        error: `Connection test failed: ${errorMessage}`,
        details: error,
      };
    }
  }
}

// Instance singleton
let clientInstance: GoogleMerchantClient | null = null;

/**
 * Obtient l'instance singleton du client
 */
export function getGoogleMerchantClient(): GoogleMerchantClient {
  clientInstance ??= new GoogleMerchantClient();
  return clientInstance;
}

/**
 * Helper pour tester rapidement la connexion
 */
export async function testGoogleMerchantConnection(): Promise<boolean> {
  try {
    const client = getGoogleMerchantClient();
    const result = await client.testConnection();
    return result.success;
  } catch (error) {
    console.error('[Google Merchant Client] Test connection failed:', error);
    return false;
  }
}
