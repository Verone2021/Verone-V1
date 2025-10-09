/**
 * 🔧 Hook : Configuration Google Merchant Center
 *
 * Gère le test de connexion et l'affichage de la configuration
 * Google Merchant Center (Account ID, Data Source, statut API)
 */

import { useState } from 'react'

export interface MerchantConfig {
  accountId: string
  dataSourceId: string
  authenticated: boolean
  apiConnected: boolean
  productCount?: number
  contentLanguage: string
  feedLabel: string
  targetCountry: string
  currency: string
}

export interface ConnectionTestResult {
  authentication: boolean
  apiConnection: boolean
  accountId: string
  dataSourceId: string
  timestamp: string
  details?: {
    configuration?: {
      accountId: string
      dataSourceId: string
      contentLanguage: string
      targetCountry: string
      baseUrl: string
      productBaseUrl: string
    }
    productListTest?: {
      success: boolean
      productCount: number
      data?: any
      error?: string
    }
  }
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error'

export function useGoogleMerchantConfig() {
  const [config, setConfig] = useState<MerchantConfig | null>(null)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [testDetails, setTestDetails] = useState<ConnectionTestResult | null>(null)

  /**
   * Teste la connexion complète à Google Merchant Center
   */
  async function testConnection(): Promise<void> {
    setTesting(true)
    setConnectionStatus('testing')
    setError(null)
    setTestDetails(null)

    try {
      // Étape 1 : Test authentification de base
      console.log('[useGoogleMerchantConfig] Testing basic authentication...')

      const authResponse = await fetch('/api/google-merchant/test-connection')
      const authData = await authResponse.json()

      if (!authResponse.ok || !authData.success) {
        throw new Error(authData.error || 'Authentication failed')
      }

      console.log('[useGoogleMerchantConfig] Authentication: ✅ Success')

      // Étape 2 : Test API connection avec liste produits
      console.log('[useGoogleMerchantConfig] Testing API connection + product list...')

      const apiResponse = await fetch('/api/google-merchant/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeProductList: true,
          testProduct: null
        })
      })
      const apiData = await apiResponse.json()

      if (!apiResponse.ok || !apiData.success) {
        throw new Error(apiData.error || 'API connection test failed')
      }

      console.log('[useGoogleMerchantConfig] API Connection: ✅ Success')
      console.log('[useGoogleMerchantConfig] Product List Test:', apiData.data.details?.productListTest)

      // Stocker les détails complets du test
      setTestDetails(apiData.data)

      // Construire l'objet config depuis les données de test
      const merchantConfig: MerchantConfig = {
        accountId: apiData.data.accountId,
        dataSourceId: apiData.data.dataSourceId,
        authenticated: apiData.data.authentication,
        apiConnected: apiData.data.apiConnection,
        productCount: apiData.data.details?.productListTest?.productCount || 0,
        contentLanguage: apiData.data.details?.configuration?.contentLanguage || 'fr',
        feedLabel: apiData.data.details?.configuration?.targetCountry || 'FR',
        targetCountry: apiData.data.details?.configuration?.targetCountry || 'FR',
        currency: 'EUR'
      }

      setConfig(merchantConfig)
      setConnectionStatus('success')
      console.log('[useGoogleMerchantConfig] ✅ Connection test complete:', merchantConfig)

    } catch (err: any) {
      console.error('[useGoogleMerchantConfig] ❌ Connection test failed:', err)
      setError(err.message || 'Unknown error occurred')
      setConnectionStatus('error')
    } finally {
      setTesting(false)
    }
  }

  /**
   * Réinitialise l'état du test
   */
  function resetTest(): void {
    setConnectionStatus('idle')
    setError(null)
    setTestDetails(null)
  }

  return {
    // État
    config,
    testing,
    connectionStatus,
    error,
    testDetails,

    // Actions
    testConnection,
    resetTest
  }
}
