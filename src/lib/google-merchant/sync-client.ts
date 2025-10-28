/**
 * Google Merchant Sync Client
 *
 * Client pour synchroniser les produits avec Google Merchant Center
 * Features: insert/update/delete + batch operations + rate limiting + retry strategy
 */

import { logger } from '@/lib/logger'
import { GoogleMerchantAuth } from './auth'
import type { GoogleMerchantProductInput } from './product-mapper'

/**
 * Configuration rate limiting
 * Google Merchant API Quotas: 100 requests/minute
 */
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 100,
  minDelayBetweenRequests: 600, // 600ms = 100 req/min max
  retryAttempts: 3,
  retryDelayMs: 1000, // Initial delay, puis exponential backoff
}

/**
 * Résultat d'une opération de sync
 */
export interface SyncResult {
  success: boolean
  productId?: string
  offerId: string
  operation: 'insert' | 'update' | 'delete'
  error?: string
  statusCode?: number
}

/**
 * Résultat d'une opération batch
 */
export interface BatchSyncResult {
  total: number
  success: number
  failed: number
  results: SyncResult[]
  duration: number
}

/**
 * Client de synchronisation Google Merchant
 */
export class GoogleMerchantSyncClient {
  private auth: GoogleMerchantAuth
  private baseUrl = 'https://merchantapi.googleapis.com'
  private accountId: string
  private dataSourceId: string
  private lastRequestTime: number = 0

  constructor() {
    this.auth = new GoogleMerchantAuth()
    this.accountId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID!
    this.dataSourceId = process.env.GOOGLE_MERCHANT_DATA_SOURCE_ID!

    if (!this.accountId || !this.dataSourceId) {
      throw new Error('Google Merchant configuration manquante (ACCOUNT_ID ou DATA_SOURCE_ID)')
    }
  }

  /**
   * Rate limiting: attend le délai minimum entre requests
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const delayNeeded = RATE_LIMIT_CONFIG.minDelayBetweenRequests - timeSinceLastRequest

    if (delayNeeded > 0) {
      await new Promise(resolve => setTimeout(resolve, delayNeeded))
    }

    this.lastRequestTime = Date.now()
  }

  /**
   * Execute une requête HTTP avec retry strategy
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      console.log('[DEBUG] Fetching URL:', url)
      console.log('[DEBUG] Fetch options:', {
        method: options.method,
        hasBody: !!options.body,
        bodyLength: options.body ? String(options.body).length : 0,
        headers: options.headers
      })

      const response = await fetch(url, options)

      console.log('[DEBUG] Fetch response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      // Si erreur 5xx ou rate limit 429 → retry
      if ((response.status >= 500 || response.status === 429) && attempt < RATE_LIMIT_CONFIG.retryAttempts) {
        const retryDelay = RATE_LIMIT_CONFIG.retryDelayMs * Math.pow(2, attempt - 1) // Exponential backoff

        logger.warn('Retrying request after error', {
          operation: 'fetch_retry',
          url,
          status: response.status,
          attempt,
          retryDelay
        })

        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.fetchWithRetry(url, options, attempt + 1)
      }

      return response
    } catch (error) {
      // Network error → retry
      if (attempt < RATE_LIMIT_CONFIG.retryAttempts) {
        const retryDelay = RATE_LIMIT_CONFIG.retryDelayMs * Math.pow(2, attempt - 1)

        logger.warn('Retrying request after network error', {
          operation: 'fetch_retry',
          url,
          attempt,
          retryDelay,
          error: error instanceof Error ? error.message : String(error)
        })

        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.fetchWithRetry(url, options, attempt + 1)
      }

      throw error
    }
  }

  /**
   * Insert un nouveau produit dans Google Merchant
   * Endpoint: POST /productInputs:insert
   */
  async insertProduct(productInput: GoogleMerchantProductInput): Promise<SyncResult> {
    const startTime = Date.now()

    try {
      await this.waitForRateLimit()

      const accessToken = await this.auth.getAccessToken()

      // 🔧 FIX: Utiliser Content API v2.1 au lieu de Merchant API v1beta
      // L'API v2.1 est stable et bien documentée
      const contentApiUrl = `https://www.googleapis.com/content/v2.1/${this.accountId}/products`

      logger.info('Inserting product to Google Merchant', {
        operation: 'product_insert',
        offerId: productInput.offerId,
        url: contentApiUrl
      })

      const response = await this.fetchWithRetry(contentApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productInput)  // 🔧 FIX: Envoyer productInput directement, pas wrapped
      })

      const data = await response.json()

      if (!response.ok) {
        logger.error('Failed to insert product', undefined, {
          operation: 'product_insert',
          offerId: productInput.offerId,
          status: response.status,
          error: data
        })

        return {
          success: false,
          offerId: productInput.offerId,
          operation: 'insert',
          error: data.error?.message || `HTTP ${response.status}`,
          statusCode: response.status
        }
      }

      logger.info('Product inserted successfully', {
        operation: 'product_insert',
        offerId: productInput.offerId,
        productId: data.productId,
        duration: Date.now() - startTime
      })

      return {
        success: true,
        productId: data.productId,
        offerId: productInput.offerId,
        operation: 'insert'
      }
    } catch (error) {
      // Enhanced error logging pour diagnostic
      const errorDetails = {
        operation: 'product_insert',
        offerId: productInput.offerId,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorKeys: error ? Object.keys(error) : [],
        errorJSON: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : null
      }

      logger.error('Exception inserting product', errorDetails)

      return {
        success: false,
        offerId: productInput.offerId,
        operation: 'insert',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Update un produit existant dans Google Merchant
   * Note: Google Merchant utilise le même endpoint insert pour update
   * Le productInput doit avoir le même offerId pour écraser l'existant
   */
  async updateProduct(productInput: GoogleMerchantProductInput): Promise<SyncResult> {
    // Google Merchant merge automatiquement si offerId existe déjà
    const result = await this.insertProduct(productInput)
    return { ...result, operation: 'update' }
  }

  /**
   * Delete un produit dans Google Merchant
   * Endpoint: POST /productInputs:delete
   */
  async deleteProduct(offerId: string): Promise<SyncResult> {
    const startTime = Date.now()

    try {
      await this.waitForRateLimit()

      const accessToken = await this.auth.getAccessToken()
      const dataSource = `accounts/${this.accountId}/dataSources/${this.dataSourceId}`
      const url = `${this.baseUrl}/products_v1beta/accounts/${this.accountId}/productInputs:delete`

      logger.info('Deleting product from Google Merchant', {
        operation: 'product_delete',
        offerId,
        dataSource
      })

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataSource,
          name: `${dataSource}/productInputs/${offerId}`
        })
      })

      if (!response.ok) {
        const data = await response.json()

        logger.error('Failed to delete product', undefined, {
          operation: 'product_delete',
          offerId,
          status: response.status,
          error: data
        })

        return {
          success: false,
          offerId,
          operation: 'delete',
          error: data.error?.message || `HTTP ${response.status}`,
          statusCode: response.status
        }
      }

      logger.info('Product deleted successfully', {
        operation: 'product_delete',
        offerId,
        duration: Date.now() - startTime
      })

      return {
        success: true,
        offerId,
        operation: 'delete'
      }
    } catch (error) {
      logger.error('Exception deleting product', undefined, {
        operation: 'product_delete',
        offerId,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        offerId,
        operation: 'delete',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Batch insert: insère plusieurs produits avec rate limiting
   */
  async insertProductsBatch(products: GoogleMerchantProductInput[]): Promise<BatchSyncResult> {
    const startTime = Date.now()
    const results: SyncResult[] = []

    logger.info('Starting batch insert', {
      operation: 'batch_insert',
      total: products.length
    })

    for (const product of products) {
      const result = await this.insertProduct(product)
      results.push(result)
    }

    const success = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const duration = Date.now() - startTime

    logger.info('Batch insert completed', {
      operation: 'batch_insert',
      total: products.length,
      success,
      failed,
      duration
    })

    return {
      total: products.length,
      success,
      failed,
      results,
      duration
    }
  }

  /**
   * Batch update: met à jour plusieurs produits avec rate limiting
   */
  async updateProductsBatch(products: GoogleMerchantProductInput[]): Promise<BatchSyncResult> {
    const startTime = Date.now()
    const results: SyncResult[] = []

    logger.info('Starting batch update', {
      operation: 'batch_update',
      total: products.length
    })

    for (const product of products) {
      const result = await this.updateProduct(product)
      results.push(result)
    }

    const success = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const duration = Date.now() - startTime

    logger.info('Batch update completed', {
      operation: 'batch_update',
      total: products.length,
      success,
      failed,
      duration
    })

    return {
      total: products.length,
      success,
      failed,
      results,
      duration
    }
  }

  /**
   * Batch delete: supprime plusieurs produits avec rate limiting
   */
  async deleteProductsBatch(offerIds: string[]): Promise<BatchSyncResult> {
    const startTime = Date.now()
    const results: SyncResult[] = []

    logger.info('Starting batch delete', {
      operation: 'batch_delete',
      total: offerIds.length
    })

    for (const offerId of offerIds) {
      const result = await this.deleteProduct(offerId)
      results.push(result)
    }

    const success = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const duration = Date.now() - startTime

    logger.info('Batch delete completed', {
      operation: 'batch_delete',
      total: offerIds.length,
      success,
      failed,
      duration
    })

    return {
      total: offerIds.length,
      success,
      failed,
      results,
      duration
    }
  }
}
