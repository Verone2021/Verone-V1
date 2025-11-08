/**
 * 🔌 API Route: Test Connexion Google Merchant Center
 *
 * GET /api/google-merchant/test-connection
 * Teste la connectivité avec l'API Google Merchant Center
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { testGoogleMerchantAuth } from '@verone/integrations/google-merchant/auth';
import {
  getGoogleMerchantClient,
  testGoogleMerchantConnection,
} from '@verone/integrations/google-merchant/client';
import { GOOGLE_MERCHANT_CONFIG } from '@verone/integrations/google-merchant/config';
import logger from '@verone/utils/logger';

interface TestConnectionResponse {
  success: boolean;
  data?: {
    authentication: boolean;
    apiConnection: boolean;
    accountId: string;
    dataSourceId: string;
    timestamp: string;
    details?: any;
  };
  error?: string;
  details?: any;
}

/**
 * GET - Teste la connexion complète à Google Merchant Center
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<TestConnectionResponse>> {
  const timer = logger.startTimer();

  try {
    logger.info('Testing Google Merchant Center connection', {
      operation: 'google_merchant_test',
      accountId: GOOGLE_MERCHANT_CONFIG.accountId,
    });

    const testResults = {
      authentication: false,
      apiConnection: false,
      accountId: GOOGLE_MERCHANT_CONFIG.accountId,
      dataSourceId: GOOGLE_MERCHANT_CONFIG.dataSourceId,
      timestamp: new Date().toISOString(),
      details: {} as any,
    };

    // 1. Test d'authentification
    logger.info('Testing authentication', { operation: 'auth_test' });
    try {
      testResults.authentication = await testGoogleMerchantAuth();
      logger.info(
        `Authentication test: ${testResults.authentication ? 'SUCCESS' : 'FAILED'}`,
        {
          operation: 'auth_test',
          success: testResults.authentication,
        }
      );
    } catch (error: any) {
      logger.error('Authentication test failed', error, {
        operation: 'auth_test_failed',
      });
      testResults.details.authError = error.message;
    }

    // 2. Test de connexion API
    if (testResults.authentication) {
      logger.info('Testing API connection', {
        operation: 'api_connection_test',
      });
      try {
        const client = getGoogleMerchantClient();
        const connectionResult = await client.testConnection();

        testResults.apiConnection = connectionResult.success;
        testResults.details.apiResponse = connectionResult.data;

        if (!connectionResult.success) {
          testResults.details.apiError = connectionResult.error;
        }

        logger.info(
          `API connection test: ${testResults.apiConnection ? 'SUCCESS' : 'FAILED'}`,
          {
            operation: 'api_connection_test',
            success: testResults.apiConnection,
          }
        );
      } catch (error: any) {
        logger.error('API connection test failed', error, {
          operation: 'api_connection_test_failed',
        });
        testResults.details.apiError = error.message;
      }
    } else {
      logger.warn('Skipping API connection test - auth failed', {
        operation: 'api_connection_test_skipped',
      });
      testResults.details.apiError = 'Authentication failed, skipping API test';
    }

    // 3. Test configuration
    logger.info('Validating configuration', { operation: 'config_validation' });
    testResults.details.configuration = {
      accountId: GOOGLE_MERCHANT_CONFIG.accountId,
      dataSourceId: GOOGLE_MERCHANT_CONFIG.dataSourceId,
      contentLanguage: GOOGLE_MERCHANT_CONFIG.contentLanguage,
      targetCountry: GOOGLE_MERCHANT_CONFIG.feedLabel,
      baseUrl: GOOGLE_MERCHANT_CONFIG.baseUrl,
      productBaseUrl: GOOGLE_MERCHANT_CONFIG.productBaseUrl,
    };

    // 4. Déterminer le succès global
    const overallSuccess =
      testResults.authentication && testResults.apiConnection;
    const duration = timer();

    if (overallSuccess) {
      logger.info(
        'Google Merchant Center connection test: SUCCESS',
        {
          operation: 'google_merchant_test_complete',
          success: true,
        },
        { duration_ms: duration }
      );

      return NextResponse.json({
        success: true,
        data: testResults,
      });
    } else {
      logger.warn(
        'Google Merchant Center connection test: FAILED',
        {
          operation: 'google_merchant_test_complete',
          success: false,
          authSuccess: testResults.authentication,
          apiSuccess: testResults.apiConnection,
        },
        { duration_ms: duration }
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Connection test failed',
          details: testResults,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Connection test crashed', error, {
      operation: 'google_merchant_test_crash',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Test de connexion échoué',
        details: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Test de connexion avec détails étendus
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<TestConnectionResponse>> {
  try {
    logger.info('Extended connection test requested', {
      operation: 'google_merchant_extended_test',
    });

    // Récupérer les données de la requête pour des tests spécifiques
    const body = await request.json().catch(() => ({}));
    const { includeProductList = false, testProduct = null } = body;

    // Effectuer le test de base
    const baseTestResponse = await GET(request);
    const baseTest = await baseTestResponse.json();

    if (!baseTest.success) {
      return baseTestResponse;
    }

    // Tests étendus
    const extendedDetails = { ...baseTest.data!.details };

    // Test listage des produits
    if (includeProductList) {
      logger.info('Testing product listing', {
        operation: 'product_list_test',
      });
      try {
        const client = getGoogleMerchantClient();
        const listResult = await client.listProducts(5); // Liste 5 produits max

        extendedDetails.productListTest = {
          success: listResult.success,
          productCount: listResult.data?.products?.length || 0,
          data: listResult.data,
          error: listResult.error,
        };
      } catch (error: any) {
        extendedDetails.productListTest = {
          success: false,
          error: error.message,
        };
      }
    }

    // Test d'un produit spécifique
    if (testProduct) {
      logger.info('Testing specific product', {
        operation: 'specific_product_test',
        productSku: testProduct,
      });
      try {
        const client = getGoogleMerchantClient();
        const productResult = await client.getProduct(testProduct);

        extendedDetails.specificProductTest = {
          sku: testProduct,
          success: productResult.success,
          exists: productResult.success,
          data: productResult.data,
          error: productResult.error,
        };
      } catch (error: any) {
        extendedDetails.specificProductTest = {
          sku: testProduct,
          success: false,
          error: error.message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...baseTest.data!,
        details: extendedDetails,
      },
    });
  } catch (error: any) {
    logger.error('Extended connection test failed', error, {
      operation: 'google_merchant_extended_test_failed',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Test de connexion étendu échoué',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
