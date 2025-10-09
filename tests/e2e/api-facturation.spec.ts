// =====================================================================
// Tests E2E: Routes API Facturation
// Date: 2025-10-11
// Description: Tests Playwright pour routes API Abby
// =====================================================================

import { test, expect } from '@playwright/test';
import { generateTestSignature } from '@/lib/abby/webhook-validator';

// =====================================================================
// CONFIGURATION
// =====================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '';
const ABBY_WEBHOOK_SECRET = process.env.ABBY_WEBHOOK_SECRET || 'test-secret-dev';

// Test sales order ID (à créer en DB avant tests)
let testSalesOrderId: string;
let testInvoiceId: string;
let testEventId: string;

// =====================================================================
// TEST SUITE: POST /api/invoices/generate
// =====================================================================

test.describe('POST /api/invoices/generate', () => {
  test.beforeAll(async ({ request }) => {
    // Setup: Créer sales_order de test (status: shipped)
    const response = await request.post(`${BASE_URL}/api/test/create-sales-order`, {
      data: {
        customer_id: 'test-customer-uuid',
        order_number: `TEST-${Date.now()}`,
        status: 'shipped',
        total_ht: 100.00,
        items: [
          {
            product_id: 'test-product-uuid',
            quantity: 2,
            unit_price_ht: 50.00,
            total_ht: 100.00,
          },
        ],
      },
    });

    const data = await response.json();
    testSalesOrderId = data.sales_order_id;
  });

  test('should generate invoice successfully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/invoices/generate`, {
      data: {
        salesOrderId: testSalesOrderId,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.invoice).toBeDefined();
    expect(data.data.invoice.sales_order_id).toBe(testSalesOrderId);
    expect(data.data.invoice.status).toBe('draft');

    testInvoiceId = data.data.invoice.id;
  });

  test('should return 400 if salesOrderId missing', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/invoices/generate`, {
      data: {},
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('salesOrderId');
  });

  test('should return 404 if sales order not found', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/invoices/generate`, {
      data: {
        salesOrderId: '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  test('should return 409 if invoice already exists', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/invoices/generate`, {
      data: {
        salesOrderId: testSalesOrderId,
      },
    });

    expect(response.status()).toBe(409);

    const data = await response.json();
    expect(data.error).toContain('already exists');
  });
});

// =====================================================================
// TEST SUITE: POST /api/webhooks/abby
// =====================================================================

test.describe('POST /api/webhooks/abby', () => {
  test.beforeEach(() => {
    testEventId = `evt_test_${Date.now()}`;
  });

  test('should process invoice.paid webhook successfully', async ({ request }) => {
    const payload = {
      id: testEventId,
      type: 'invoice.paid',
      data: {
        invoice: {
          id: 'abby_inv_123',
          invoiceNumber: 'FAC-2024-001',
          status: 'paid',
        },
        payment: {
          amount: 120.00,
          paymentDate: '2025-10-11',
          paymentMethod: 'bank_transfer',
        },
      },
      createdAt: new Date().toISOString(),
    };

    const signature = generateTestSignature(payload, ABBY_WEBHOOK_SECRET);

    const response = await request.post(`${BASE_URL}/api/webhooks/abby`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Abby-Signature': signature,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.eventId).toBe(testEventId);
    expect(data.eventType).toBe('invoice.paid');
  });

  test('should be idempotent (duplicate event)', async ({ request }) => {
    const payload = {
      id: testEventId,
      type: 'invoice.sent',
      data: {
        invoice: {
          id: 'abby_inv_456',
          invoiceNumber: 'FAC-2024-002',
          status: 'sent',
        },
      },
      createdAt: new Date().toISOString(),
    };

    const signature = generateTestSignature(payload, ABBY_WEBHOOK_SECRET);

    // Premier appel
    const response1 = await request.post(`${BASE_URL}/api/webhooks/abby`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Abby-Signature': signature,
      },
    });

    expect(response1.status()).toBe(200);

    // Deuxième appel (même event_id)
    const response2 = await request.post(`${BASE_URL}/api/webhooks/abby`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Abby-Signature': signature,
      },
    });

    expect(response2.status()).toBe(200);

    const data2 = await response2.json();
    expect(data2.message).toContain('already processed');
  });

  test('should return 401 if signature invalid', async ({ request }) => {
    const payload = {
      id: testEventId,
      type: 'invoice.paid',
      data: {
        invoice: { id: 'test' },
        payment: { amount: 100 },
      },
      createdAt: new Date().toISOString(),
    };

    const response = await request.post(`${BASE_URL}/api/webhooks/abby`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Abby-Signature': 'invalid-signature',
      },
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toContain('signature');
  });

  test('should return 400 if required fields missing', async ({ request }) => {
    const payload = {
      type: 'invoice.paid',
      data: {},
    };

    const signature = generateTestSignature(payload, ABBY_WEBHOOK_SECRET);

    const response = await request.post(`${BASE_URL}/api/webhooks/abby`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Abby-Signature': signature,
      },
    });

    expect(response.status()).toBe(400);
  });
});

// =====================================================================
// TEST SUITE: GET /api/reports/bfa/:year
// =====================================================================

test.describe('GET /api/reports/bfa/:year', () => {
  test('should generate BFA report successfully', async ({ request }) => {
    const year = new Date().getFullYear();

    const response = await request.get(`${BASE_URL}/api/reports/bfa/${year}`, {
      headers: {
        // Note: Authentification requise (admin)
        // À adapter selon votre mécanisme auth
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.fiscalYear).toBe(year);
    expect(data.data.summary).toBeDefined();
    expect(data.data.summary.totalCustomers).toBeGreaterThanOrEqual(0);
    expect(data.data.customers).toBeInstanceOf(Array);
  });

  test('should return 400 if year invalid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reports/bfa/invalid-year`);

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Invalid year');
  });

  test('should return 403 if not admin', async ({ request }) => {
    // Test sans auth admin
    const response = await request.get(`${BASE_URL}/api/reports/bfa/2024`);

    // Selon implémentation auth, devrait être 401 ou 403
    expect([401, 403]).toContain(response.status());
  });
});

// =====================================================================
// TEST SUITE: GET /api/cron/sync-abby-queue
// =====================================================================

test.describe('GET /api/cron/sync-abby-queue', () => {
  test('should process sync queue successfully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cron/sync-abby-queue`, {
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.processed).toBeGreaterThanOrEqual(0);
    expect(data.data.succeeded).toBeGreaterThanOrEqual(0);
    expect(data.data.failed).toBeGreaterThanOrEqual(0);
    expect(data.data.errors).toBeInstanceOf(Array);
  });

  test('should return 401 if CRON_SECRET invalid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cron/sync-abby-queue`, {
      headers: {
        Authorization: 'Bearer invalid-secret',
      },
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toContain('Unauthorized');
  });

  test('should return 401 if Authorization header missing', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cron/sync-abby-queue`);

    expect(response.status()).toBe(401);
  });
});

// =====================================================================
// TEST SUITE: GET /api/cron/cleanup-abby-data
// =====================================================================

test.describe('GET /api/cron/cleanup-abby-data', () => {
  test('should cleanup old data successfully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cron/cleanup-abby-data`, {
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.syncOperations).toBeGreaterThanOrEqual(0);
    expect(data.data.webhookEvents).toBeGreaterThanOrEqual(0);
    expect(data.data.statusHistory).toBeGreaterThanOrEqual(0);
  });

  test('should return 401 if CRON_SECRET invalid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/cron/cleanup-abby-data`, {
      headers: {
        Authorization: 'Bearer wrong-secret',
      },
    });

    expect(response.status()).toBe(401);
  });
});
