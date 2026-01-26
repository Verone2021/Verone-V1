/**
 * Test data fixtures for E2E tests
 * Provides predefined test data for products, orders, etc.
 */

export const TEST_PRODUCT_WITH_STORAGE = {
  name: 'Test Produit Stocké',
  description: 'Produit avec stockage Vérone pour tests E2E',
  affiliate_payout_ht: 100,
  store_at_verone: true,
  length_cm: 50,
  width_cm: 30,
  height_cm: 20,
  stock_units: 10,
};

export const TEST_PRODUCT_WITHOUT_STORAGE = {
  name: 'Test Produit Non Stocké',
  description: 'Produit expédié par affilié pour tests E2E',
  affiliate_payout_ht: 80,
  store_at_verone: false,
};

export const TEST_PRODUCT_MINIMAL = {
  name: 'Test Produit Minimal',
  description: 'Produit minimal pour tests E2E',
  affiliate_payout_ht: 50,
  store_at_verone: false,
};

export const TEST_ORDER = {
  customer_name: 'Test Customer E2E',
  customer_email: 'test-customer@verone-e2e.fr',
  montant_ht: 200,
  montant_ttc: 240,
  status: 'paid',
};

/**
 * Generate unique test product name
 * @param baseName - Base name for the product
 * @returns Unique product name with timestamp
 */
export const generateTestProductName = (baseName: string = 'Test Produit') => {
  const timestamp = Date.now();
  return `${baseName} ${timestamp}`;
};

/**
 * Generate unique test customer name
 * @param baseName - Base name for the customer
 * @returns Unique customer name with timestamp
 */
export const generateTestCustomerName = (
  baseName: string = 'Test Customer'
) => {
  const timestamp = Date.now();
  return `${baseName} ${timestamp}`;
};

/**
 * Generate unique test email
 * @param prefix - Email prefix
 * @returns Unique email with timestamp
 */
export const generateTestEmail = (prefix: string = 'test') => {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}@verone-e2e.fr`;
};

/**
 * Predefined test affiliate IDs (replace with actual IDs from database)
 */
export const TEST_AFFILIATE_IDS = {
  pokawa: '550e8400-e29b-41d4-a716-446655440000', // Pokawa enseigne ID
  testOrg: 'test-org-affiliate-id', // Test organization affiliate ID
};

/**
 * Predefined test organization IDs (replace with actual IDs from database)
 */
export const TEST_ORGANIZATION_IDS = {
  testOrg: 'test-org-id', // Test organization ID
};
