/**
 * 📡 API Business Rules Tests - Vérone Back Office
 *
 * Tests validation des règles métier via API :
 * - Catalogue API avec business rules
 * - Tarification B2B/B2C
 * - Validation stock et disponibilité
 * - Gestion erreurs et edge cases
 * - Performance monitoring
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

// Configuration business rules Vérone
const BUSINESS_RULES = {
  MAX_DISCOUNT_PERCENT: 40,
  MIN_ORDER_QUANTITY: 1,
  MAX_PRODUCTS_PER_REQUEST: 100,
  VAT_RATE: 0.20, // 20% TVA France
  STOCK_THRESHOLD_WARNING: 10
};

// Endpoints à tester
const API_ENDPOINTS = {
  HEALTH: '/api/health',
  PRODUCTS: '/api/catalogue/products',
  PRODUCT_CREATE: '/api/catalogue/products',
  FEEDS_FACEBOOK: '/api/feeds/facebook.csv',
  FEEDS_GOOGLE: '/api/feeds/google.csv'
};

test.describe('📡 API Endpoints - Business Logic Validation', () => {

  test('🏥 Health Check API - System Status', async ({ request }) => {
    await test.step('Basic health check', async () => {
      const response = await request.get(API_ENDPOINTS.HEALTH);

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(200);

      const health = await response.json();
      expect(health.status).toBe('healthy');
      expect(health.service).toBe('verone-back-office');
      expect(health.timestamp).toBeDefined();
    });

    await test.step('Health check performance', async () => {
      const startTime = Date.now();
      const response = await request.get(API_ENDPOINTS.HEALTH);
      const responseTime = Date.now() - startTime;

      expect(response.ok()).toBe(true);
      expect(responseTime).toBeLessThan(500); // Health check <500ms

      // Headers de performance
      const serverTime = response.headers()['x-response-time'];
      if (serverTime) {
        expect(parseInt(serverTime)).toBeLessThan(100);
      }
    });

    await test.step('Health check memory monitoring', async () => {
      const response = await request.get(API_ENDPOINTS.HEALTH);
      const health = await response.json();

      if (health.checks?.memory) {
        expect(health.checks.memory.status).toMatch(/healthy|warning/);
        expect(health.checks.memory.usage_mb).toBeGreaterThan(0);
        expect(health.checks.memory.usage_mb).toBeLessThan(1000); // <1GB usage
      }
    });
  });

  test('🛋️ Products API - Catalogue Business Rules', async ({ request }) => {
    await test.step('Get products with pagination', async () => {
      const response = await request.get(API_ENDPOINTS.PRODUCTS + '?page=1&limit=10');

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.pagination).toBeDefined();

      // Validation structure pagination
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total_count).toBeGreaterThanOrEqual(0);

      // Headers de performance
      const totalCount = response.headers()['x-total-count'];
      const queryTime = response.headers()['x-query-time'];

      if (totalCount) {
        expect(parseInt(totalCount)).toBeGreaterThanOrEqual(0);
      }

      if (queryTime) {
        expect(parseInt(queryTime)).toBeLessThan(1000); // <1s query time
      }
    });

    await test.step('Product structure validation', async () => {
      const response = await request.get(API_ENDPOINTS.PRODUCTS + '?limit=1');
      const data = await response.json();

      if (data.data.length > 0) {
        const product = data.data[0];

        // Champs obligatoires
        expect(product.id).toBeDefined();
        expect(product.sku).toBeDefined();
        expect(product.name).toBeDefined();
        expect(product.price_ht).toBeDefined();
        expect(product.price_ttc).toBeDefined();
        expect(product.status).toBeDefined();

        // Validation tarification
        const expectedTTC = Math.round(product.price_ht * (1 + BUSINESS_RULES.VAT_RATE));
        expect(product.price_ttc).toBe(expectedTTC);

        // Validation status
        expect(['draft', 'active', 'inactive', 'discontinued']).toContain(product.status);

        // Validation availability
        if (product.availability_status) {
          expect(['in_stock', 'out_of_stock', 'preorder', 'coming_soon', 'discontinued'])
            .toContain(product.availability_status);
        }
      }
    });

    await test.step('Category filtering', async () => {
      const categories = ['canapes', 'tables', 'eclairage', 'decoration'];

      for (const category of categories) {
        const response = await request.get(API_ENDPOINTS.PRODUCTS + `?category=${category}&limit=5`);

        expect(response.ok()).toBe(true);

        const data = await response.json();

        // Si des produits retournés, vérifier catégorie
        if (data.data.length > 0) {
          data.data.forEach((product: any) => {
            expect(product.category).toBe(category);
          });
        }
      }
    });

    await test.step('Search functionality', async () => {
      const searchTerms = ['vérone', 'canapé', 'table', 'éclairage'];

      for (const term of searchTerms) {
        const response = await request.get(API_ENDPOINTS.PRODUCTS + `?search=${encodeURIComponent(term)}&limit=5`);

        expect(response.ok()).toBe(true);

        const data = await response.json();

        // Si résultats, vérifier pertinence
        if (data.data.length > 0) {
          const hasRelevantResult = data.data.some((product: any) =>
            product.name.toLowerCase().includes(term.toLowerCase()) ||
            product.description?.toLowerCase().includes(term.toLowerCase()) ||
            product.sku.toLowerCase().includes(term.toLowerCase())
          );

          expect(hasRelevantResult).toBe(true);
        }
      }
    });

    await test.step('Limit validation - Business rule enforcement', async () => {
      // Test limite maximale
      const overLimitResponse = await request.get(API_ENDPOINTS.PRODUCTS + '?limit=200');
      const overLimitData = await overLimitResponse.json();

      // Limite doit être appliquée (max 100)
      expect(overLimitData.pagination.limit).toBeLessThanOrEqual(BUSINESS_RULES.MAX_PRODUCTS_PER_REQUEST);

      // Test limite négative
      const negativeLimitResponse = await request.get(API_ENDPOINTS.PRODUCTS + '?limit=-5');
      expect(negativeLimitResponse.ok()).toBe(true); // Doit gérer gracieusement

      // Test limite zéro
      const zeroLimitResponse = await request.get(API_ENDPOINTS.PRODUCTS + '?limit=0');
      const zeroLimitData = await zeroLimitResponse.json();
      expect(zeroLimitData.pagination.limit).toBeGreaterThan(0);
    });
  });

  test('📝 Product Creation API - Validation Rules', async ({ request }) => {
    await test.step('Valid product creation', async () => {
      const newProduct = {
        name: 'Test Canapé API E2E',
        sku: 'VER-E2E-TEST-001',
        description: 'Produit test pour validation API E2E',
        price_ht: 199900, // 1999€ HT
        category: 'canapes',
        brand: 'Vérone',
        status: 'draft'
      };

      const response = await request.post(API_ENDPOINTS.PRODUCT_CREATE, {
        data: newProduct
      });

      expect(response.ok()).toBe(true);
      expect(response.status()).toBe(201);

      const data = await response.json();
      expect(data.data).toBeDefined();

      const createdProduct = data.data;

      // Validation données créées
      expect(createdProduct.name).toBe(newProduct.name);
      expect(createdProduct.sku).toBe(newProduct.sku);
      expect(createdProduct.price_ht).toBe(newProduct.price_ht);

      // Validation calcul automatique TVA
      const expectedTTC = newProduct.price_ht * 1.2; // 20% TVA
      expect(createdProduct.price_ttc).toBe(expectedTTC);

      // Validation timestamps
      expect(createdProduct.created_at).toBeDefined();
      expect(createdProduct.updated_at).toBeDefined();
      expect(createdProduct.id).toBeDefined();
    });

    await test.step('Validation errors - Missing required fields', async () => {
      const invalidProducts = [
        { description: 'Manque name et sku' }, // Manque name, sku, price_ht
        { name: 'Test', description: 'Manque sku et price' }, // Manque sku, price_ht
        { name: 'Test', sku: 'TEST-001' } // Manque price_ht
      ];

      for (const invalidProduct of invalidProducts) {
        const response = await request.post(API_ENDPOINTS.PRODUCT_CREATE, {
          data: invalidProduct
        });

        expect(response.status()).toBe(400); // Bad Request

        const errorData = await response.json();
        expect(errorData.error).toBeDefined();
        expect(errorData.missing_fields).toBeDefined();
        expect(errorData.missing_fields.length).toBeGreaterThan(0);
      }
    });

    await test.step('Business rules validation', async () => {
      // Prix négatif
      const negativePrice = {
        name: 'Test Prix Négatif',
        sku: 'VER-NEGATIVE-001',
        price_ht: -1000,
        category: 'canapes'
      };

      const negativePriceResponse = await request.post(API_ENDPOINTS.PRODUCT_CREATE, {
        data: negativePrice
      });

      // Doit rejeter prix négatif
      expect(negativePriceResponse.status()).toBe(400);

      // SKU duplicate (si gestion implémentée)
      const duplicateSku = {
        name: 'Test Duplicate SKU',
        sku: 'VER-E2E-TEST-001', // Même SKU que test précédent
        price_ht: 100000,
        category: 'tables'
      };

      const duplicateResponse = await request.post(API_ENDPOINTS.PRODUCT_CREATE, {
        data: duplicateSku
      });

      // Peut retourner 400 (duplicate) ou 201 (si pas de contrainte)
      expect([201, 400, 409]).toContain(duplicateResponse.status());
    });
  });

  test('📊 Feeds API - Export Business Logic', async ({ request }) => {
    await test.step('Facebook feed generation', async () => {
      const response = await request.get(API_ENDPOINTS.FEEDS_FACEBOOK);

      // Si endpoint implémenté
      if (response.status() !== 404) {
        expect(response.ok()).toBe(true);

        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('text/csv');

        // Validation structure CSV si données présentes
        const csvContent = await response.text();
        if (csvContent.length > 0) {
          const lines = csvContent.split('\n');
          expect(lines.length).toBeGreaterThan(1); // Header + au moins 1 produit

          // Header Facebook Business Manager
          const header = lines[0];
          expect(header).toContain('id');
          expect(header).toContain('title');
          expect(header).toContain('price');
        }
      }
    });

    await test.step('Google feed generation', async () => {
      const response = await request.get(API_ENDPOINTS.FEEDS_GOOGLE);

      // Si endpoint implémenté
      if (response.status() !== 404) {
        expect(response.ok()).toBe(true);

        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('text/csv');

        // Validation structure CSV Google Merchant
        const csvContent = await response.text();
        if (csvContent.length > 0) {
          const lines = csvContent.split('\n');
          expect(lines.length).toBeGreaterThan(1);

          const header = lines[0];
          expect(header).toContain('id');
          expect(header).toContain('title');
          expect(header).toContain('price');
          expect(header).toContain('link');
        }
      }
    });

    await test.step('Feeds performance validation', async () => {
      const startTime = Date.now();
      const response = await request.get(API_ENDPOINTS.FEEDS_FACEBOOK);

      if (response.status() !== 404) {
        const generationTime = Date.now() - startTime;

        // SLO: Feeds <10s
        expect(generationTime).toBeLessThan(10000);

        console.log(`📊 Facebook feed generation: ${generationTime}ms`);
      }
    });
  });

  test('🔒 API Security - Error Handling', async ({ request }) => {
    await test.step('Invalid endpoints handling', async () => {
      const invalidEndpoints = [
        '/api/nonexistent',
        '/api/catalogue/invalid',
        '/api/../../../etc/passwd',
        '/api/catalogue/products/<script>alert(1)</script>'
      ];

      for (const endpoint of invalidEndpoints) {
        const response = await request.get(endpoint);

        // Doit retourner 404 ou autre erreur appropriée
        expect([400, 404, 403]).toContain(response.status());

        // Ne doit pas exposer d'informations sensibles
        const responseText = await response.text();
        expect(responseText).not.toContain('password');
        expect(responseText).not.toContain('secret');
        expect(responseText).not.toContain('token');
      }
    });

    await test.step('Rate limiting validation', async () => {
      // Test burst requests
      const promises = Array(20).fill(0).map(() =>
        request.get(API_ENDPOINTS.PRODUCTS + '?limit=1')
      );

      const responses = await Promise.all(promises);

      // La plupart doivent réussir
      const successCount = responses.filter(r => r.ok()).length;
      expect(successCount).toBeGreaterThan(15); // 75% success minimum

      // Vérifier si rate limiting activé
      const rateLimited = responses.some(r => r.status() === 429);
      if (rateLimited) {
        console.log('✅ Rate limiting detected and working');
      }
    });

    await test.step('Malformed request handling', async () => {
      // JSON malformé
      const malformedResponse = await request.post(API_ENDPOINTS.PRODUCT_CREATE, {
        data: '{"invalid": json}',
        headers: { 'Content-Type': 'application/json' }
      });

      expect([400, 422]).toContain(malformedResponse.status());

      // Headers manquants
      const noContentTypeResponse = await request.post(API_ENDPOINTS.PRODUCT_CREATE, {
        data: { name: 'Test' }
        // Sans Content-Type header
      });

      expect([400, 415, 422]).toContain(noContentTypeResponse.status());
    });
  });
});