/**
 * 🔌 API Route: Test Connexion Google Merchant Center
 *
 * GET /api/google-merchant/test-connection
 * Teste la connectivité avec l'API Google Merchant Center
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGoogleMerchantClient, testGoogleMerchantConnection } from '@/lib/google-merchant/client'
import { testGoogleMerchantAuth } from '@/lib/google-merchant/auth'
import { GOOGLE_MERCHANT_CONFIG } from '@/lib/google-merchant/config'

interface TestConnectionResponse {
  success: boolean
  data?: {
    authentication: boolean
    apiConnection: boolean
    accountId: string
    dataSourceId: string
    timestamp: string
    details?: any
  }
  error?: string
  details?: any
}

/**
 * GET - Teste la connexion complète à Google Merchant Center
 */
export async function GET(request: NextRequest): Promise<NextResponse<TestConnectionResponse>> {
  try {
    console.log('[API] Testing Google Merchant Center connection...')

    const testResults = {
      authentication: false,
      apiConnection: false,
      accountId: GOOGLE_MERCHANT_CONFIG.accountId,
      dataSourceId: GOOGLE_MERCHANT_CONFIG.dataSourceId,
      timestamp: new Date().toISOString(),
      details: {} as any
    }

    // 1. Test d'authentification
    console.log('[API] Testing authentication...')
    try {
      testResults.authentication = await testGoogleMerchantAuth()
      console.log(`[API] Authentication test: ${testResults.authentication ? '✅' : '❌'}`)
    } catch (error: any) {
      console.error('[API] Authentication test failed:', error)
      testResults.details.authError = error.message
    }

    // 2. Test de connexion API
    if (testResults.authentication) {
      console.log('[API] Testing API connection...')
      try {
        const client = getGoogleMerchantClient()
        const connectionResult = await client.testConnection()

        testResults.apiConnection = connectionResult.success
        testResults.details.apiResponse = connectionResult.data

        if (!connectionResult.success) {
          testResults.details.apiError = connectionResult.error
        }

        console.log(`[API] API connection test: ${testResults.apiConnection ? '✅' : '❌'}`)
      } catch (error: any) {
        console.error('[API] API connection test failed:', error)
        testResults.details.apiError = error.message
      }
    } else {
      console.log('[API] Skipping API connection test due to authentication failure')
      testResults.details.apiError = 'Authentication failed, skipping API test'
    }

    // 3. Test configuration
    console.log('[API] Validating configuration...')
    testResults.details.configuration = {
      accountId: GOOGLE_MERCHANT_CONFIG.accountId,
      dataSourceId: GOOGLE_MERCHANT_CONFIG.dataSourceId,
      contentLanguage: GOOGLE_MERCHANT_CONFIG.contentLanguage,
      targetCountry: GOOGLE_MERCHANT_CONFIG.feedLabel,
      baseUrl: GOOGLE_MERCHANT_CONFIG.baseUrl,
      productBaseUrl: GOOGLE_MERCHANT_CONFIG.productBaseUrl
    }

    // 4. Déterminer le succès global
    const overallSuccess = testResults.authentication && testResults.apiConnection

    if (overallSuccess) {
      console.log('[API] Google Merchant Center connection test: ✅ SUCCESS')
      return NextResponse.json({
        success: true,
        data: testResults
      })
    } else {
      console.log('[API] Google Merchant Center connection test: ❌ FAILED')
      return NextResponse.json({
        success: false,
        error: 'Connection test failed',
        details: testResults
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[API] Connection test crashed:', error)

    return NextResponse.json({
      success: false,
      error: 'Test de connexion échoué',
      details: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

/**
 * POST - Test de connexion avec détails étendus
 */
export async function POST(request: NextRequest): Promise<NextResponse<TestConnectionResponse>> {
  try {
    console.log('[API] Extended connection test requested...')

    // Récupérer les données de la requête pour des tests spécifiques
    const body = await request.json().catch(() => ({}))
    const { includeProductList = false, testProduct = null } = body

    // Effectuer le test de base
    const baseTestResponse = await GET(request)
    const baseTest = await baseTestResponse.json()

    if (!baseTest.success) {
      return baseTestResponse
    }

    // Tests étendus
    const extendedDetails = { ...baseTest.data!.details }

    // Test listage des produits
    if (includeProductList) {
      console.log('[API] Testing product listing...')
      try {
        const client = getGoogleMerchantClient()
        const listResult = await client.listProducts(5) // Liste 5 produits max

        extendedDetails.productListTest = {
          success: listResult.success,
          productCount: listResult.data?.products?.length || 0,
          data: listResult.data,
          error: listResult.error
        }
      } catch (error: any) {
        extendedDetails.productListTest = {
          success: false,
          error: error.message
        }
      }
    }

    // Test d'un produit spécifique
    if (testProduct) {
      console.log(`[API] Testing specific product: ${testProduct}`)
      try {
        const client = getGoogleMerchantClient()
        const productResult = await client.getProduct(testProduct)

        extendedDetails.specificProductTest = {
          sku: testProduct,
          success: productResult.success,
          exists: productResult.success,
          data: productResult.data,
          error: productResult.error
        }
      } catch (error: any) {
        extendedDetails.specificProductTest = {
          sku: testProduct,
          success: false,
          error: error.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...baseTest.data!,
        details: extendedDetails
      }
    })

  } catch (error: any) {
    console.error('[API] Extended connection test failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Test de connexion étendu échoué',
      details: error.message
    }, { status: 500 })
  }
}