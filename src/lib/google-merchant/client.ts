/**
 * 🛒 Google Merchant Center API Client
 *
 * Client principal pour interagir avec l'API Google Merchant Center
 * Utilise l'authentification Service Account et les transformers
 */

import { GoogleMerchantAuth, getGoogleMerchantAuth } from './auth';
import {
  transformProductForGoogle,
  validateGoogleMerchantProduct,
} from './transformer';
import { GOOGLE_MERCHANT_CONFIG, getResourcePaths } from './config';

// Types de réponse Google Merchant API
interface GoogleMerchantApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

interface ProductInputResponse {
  name: string;
  product: string;
  offerId: string;
  contentLanguage: string;
  feedLabel: string;
  productAttributes: any;
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

    console.log('[Google Merchant Client] Initialized:', {
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
    body?: any
  ): Promise<GoogleMerchantApiResponse<T>> {
    try {
      const headers = await this.auth.getAuthHeaders();
      const url = `${this.baseUrl}/${endpoint}`;

      console.log(`[Google Merchant Client] ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) }),
      });

      // Log raw response for debugging
      const responseText = await response.text();
      console.log(
        `[Google Merchant Client] Response status: ${response.status}`
      );
      console.log(
        `[Google Merchant Client] Response headers:`,
        Object.fromEntries(response.headers.entries())
      );
      console.log(
        `[Google Merchant Client] Response body (first 500 chars):`,
        responseText.substring(0, 500)
      );

      // Parse JSON response
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Google Merchant Client] Failed to parse JSON response');
        return {
          success: false,
          error: `Invalid JSON response from Google API (Status ${response.status}): ${responseText.substring(0, 200)}`,
          details: { status: response.status, body: responseText },
        };
      }

      if (!response.ok) {
        console.error('[Google Merchant Client] API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });

        return {
          success: false,
          error: `API Error ${response.status}: ${responseData.error?.message || response.statusText}`,
          details: responseData,
        };
      }

      console.log('[Google Merchant Client] API Success:', {
        endpoint,
        status: response.status,
      });

      return {
        success: true,
        data: responseData,
      };
    } catch (error: any) {
      console.error('[Google Merchant Client] Request failed:', error);
      return {
        success: false,
        error: `Network error: ${error.message}`,
        details: error,
      };
    }
  }

  /**
   * Insère un produit dans Google Merchant Center
   */
  async insertProduct(
    productData: any
  ): Promise<GoogleMerchantApiResponse<ProductInputResponse>> {
    try {
      // 1. Transformer le produit
      const transformedProduct = transformProductForGoogle(productData);

      // 2. Valider le produit transformé
      const validation = validateGoogleMerchantProduct(transformedProduct);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          details: { errors: validation.errors, product: transformedProduct },
        };
      }

      // 3. Construire l'endpoint avec dataSource en query parameter (format REST API officiel)
      // Documentation: https://developers.google.com/merchant/api/reference/rest/products_v1beta/accounts.productInputs/insert
      // Format: POST https://merchantapi.googleapis.com/products/v1beta/{parent=accounts/*}/productInputs:insert
      const endpoint = `products/v1beta/accounts/${this.accountId}/productInputs:insert?dataSource=${encodeURIComponent(this.dataSourcePath)}`;

      // 4. Envoyer le ProductInput directement dans le body (pas de wrapper)
      const result = await this.makeRequest<ProductInputResponse>(
        endpoint,
        'POST',
        transformedProduct
      );

      if (result.success) {
        console.log('[Google Merchant Client] Product inserted successfully:', {
          sku: productData.sku,
          googleProductId: result.data?.name,
        });
      }

      return result;
    } catch (error: any) {
      console.error('[Google Merchant Client] Insert product failed:', error);
      return {
        success: false,
        error: `Insert failed: ${error.message}`,
        details: error,
      };
    }
  }

  /**
   * Met à jour un produit existant dans Google Merchant Center
   */
  async updateProduct(
    productData: any
  ): Promise<GoogleMerchantApiResponse<ProductInputResponse>> {
    try {
      // Pour Google Merchant API, la mise à jour se fait via une nouvelle insertion
      // qui écrase automatiquement le produit existant avec le même offerId
      const result = await this.insertProduct(productData);

      if (result.success) {
        console.log('[Google Merchant Client] Product updated successfully:', {
          sku: productData.sku,
        });
      }

      return result;
    } catch (error: any) {
      console.error('[Google Merchant Client] Update product failed:', error);
      return {
        success: false,
        error: `Update failed: ${error.message}`,
        details: error,
      };
    }
  }

  /**
   * Supprime un produit de Google Merchant Center
   */
  async deleteProduct(sku: string, dataSource?: string): Promise<GoogleMerchantApiResponse> {
    try {
      // Format: DELETE /products/v1beta/{name=accounts/*/productInputs/*}?dataSource=accounts/*/dataSources/*
      const productInputName = `${getResourcePaths().productInputs}/${GOOGLE_MERCHANT_CONFIG.contentLanguage}~${GOOGLE_MERCHANT_CONFIG.feedLabel}~${sku}`;
      const dataSourceToUse = dataSource || this.dataSourcePath;
      const endpoint = `${productInputName}?dataSource=${encodeURIComponent(dataSourceToUse)}`;

      const result = await this.makeRequest(endpoint, 'DELETE');

      if (result.success) {
        console.log('[Google Merchant Client] Product deleted successfully:', {
          sku,
          dataSource: dataSourceToUse,
        });
      }

      return result;
    } catch (error: any) {
      console.error('[Google Merchant Client] Delete product failed:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
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
    } catch (error: any) {
      console.error('[Google Merchant Client] Get product failed:', error);
      return {
        success: false,
        error: `Get failed: ${error.message}`,
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
    } catch (error: any) {
      console.error('[Google Merchant Client] List products failed:', error);
      return {
        success: false,
        error: `List failed: ${error.message}`,
        details: error,
      };
    }
  }

  /**
   * Synchronise un lot de produits (batch operation)
   */
  async batchSyncProducts(
    products: any[]
  ): Promise<GoogleMerchantApiResponse[]> {
    console.log(
      `[Google Merchant Client] Batch syncing ${products.length} products`
    );

    const results: GoogleMerchantApiResponse[] = [];
    const batchSize = GOOGLE_MERCHANT_CONFIG.rateLimit.batchSize;

    // Traitement par batch pour respecter les rate limits
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      console.log(
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

    console.log(
      `[Google Merchant Client] Batch sync completed: ${successCount} success, ${errorCount} errors`
    );

    return results;
  }

  /**
   * Teste la connectivité avec l'API Google Merchant Center
   */
  async testConnection(): Promise<GoogleMerchantApiResponse> {
    try {
      console.log('[Google Merchant Client] Testing connection...');

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
        console.log('[Google Merchant Client] Connection test: ✅ Success');
        return {
          success: true,
          data: { message: 'Connection successful', auth: true, api: true },
        };
      } else {
        console.log('[Google Merchant Client] Connection test: ❌ API Failed');
        return listResult;
      }
    } catch (error: any) {
      console.error('[Google Merchant Client] Connection test failed:', error);
      return {
        success: false,
        error: `Connection test failed: ${error.message}`,
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
  if (!clientInstance) {
    clientInstance = new GoogleMerchantClient();
  }
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
