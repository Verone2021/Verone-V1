/**
 * 🏪 Google Merchant Center API Configuration
 *
 * Configuration centralisée pour l'intégration Google Merchant Center
 * Account ID: 5495521926 (Vérone)
 * Data Source: 10571293810 ("Cursor")
 */

export const GOOGLE_MERCHANT_CONFIG = {
  // Vérone Google Merchant Center Account
  accountId: '5495521926',
  dataSourceId: '10628192287',

  // API Configuration
  apiVersion: 'v1',
  baseUrl: 'https://merchantapi.googleapis.com',

  // Product Configuration
  contentLanguage: 'fr',
  feedLabel: 'FR',
  targetCountry: 'FR',
  currency: 'EUR',

  // Authentication Scopes
  scopes: ['https://www.googleapis.com/auth/content'],

  // Rate Limiting
  rateLimit: {
    requestsPerSecond: 5,
    batchSize: 1000,
  },

  // URLs
  productBaseUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veronecollections.fr',

  // Validation
  validation: {
    maxTitleLength: 150,
    maxDescriptionLength: 200,
    maxHighlightLength: 150,
  },
} as const;

export type GoogleMerchantConfig = typeof GOOGLE_MERCHANT_CONFIG;

// Helper pour construire les URLs de ressources
export const getResourcePaths = (
  accountId = GOOGLE_MERCHANT_CONFIG.accountId
) => ({
  account: `accounts/${accountId}`,
  dataSource: `accounts/${accountId}/dataSources/${GOOGLE_MERCHANT_CONFIG.dataSourceId}`,
  // 🔧 FIX: URLs correctes selon documentation officielle Google Merchant API v1beta
  productInputs: `products/${GOOGLE_MERCHANT_CONFIG.apiVersion}/accounts/${accountId}/productInputs`,
  products: `products/${GOOGLE_MERCHANT_CONFIG.apiVersion}/accounts/${accountId}/products`,
});

// Helper pour validation des champs requis
export const validateGoogleMerchantEnv = () => {
  const requiredEnvVars = [
    'GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_MERCHANT_PRIVATE_KEY',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes pour Google Merchant: ${missing.join(', ')}`
    );
  }

  return true;
};
