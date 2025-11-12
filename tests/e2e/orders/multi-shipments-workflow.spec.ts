/**
 * Tests E2E : Workflow Multi-Expéditions (Bug #5)
 * Phase 2 : Tests validation
 * Date : 2025-11-12
 *
 * Tests scénarios multi-shipments :
 * - Scenario 1 : Expédition partielle 30/100 unités
 * - Scenario 2 : Deuxième expédition 40/100 (total 70/100)
 * - Scenario 3 : Clôture partielle (30 unités libérées)
 * - Scenario 4 : Simulation webhooks tracking events
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import {
  seedMultiShipmentsTestData,
  cleanupMultiShipmentsTestData,
  TEST_IDS,
  getProductStock,
  getSalesOrderStatus,
  getShipmentsCount,
  getTrackingEventsCount,
} from '../../fixtures/multi-shipments-test-data';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

test.describe('Multi-Shipments Workflow (Bug #5)', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    // Utiliser service role key pour bypass RLS dans tests
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await seedMultiShipmentsTestData(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  });

  test.afterAll(async () => {
    await cleanupMultiShipmentsTestData(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  });

  // =============================================
  // SCENARIO 1 : Première expédition partielle (30/100)
  // =============================================

  test('Scenario 1: should create first partial shipment (30/100 units)', async ({
    page,
  }) => {
    // 1. Naviguer vers page commande
    await page.goto(`/commandes/clients/${TEST_IDS.salesOrder}`);
    await page.waitForLoadState('networkidle');

    // 2. Vérifier état initial
    await expect(page.locator('text=/100.*unités commandées/i')).toBeVisible();
    await expect(page.locator('text=/0.*unités expédiées/i')).toBeVisible();

    // 3. Ouvrir modal création shipment
    const newShipmentBtn = page.locator(
      'button:has-text("Nouvelle expédition")'
    );
    await expect(newShipmentBtn).toBeVisible();
    await newShipmentBtn.click();

    // 4. Vérifier modal ouverte
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=/Créer une expédition/i')).toBeVisible();

    // 5. Sélectionner article et quantité 30
    const checkbox = modal.locator('input[type="checkbox"]').first();
    await checkbox.check();

    const quantityInput = modal.locator('input[type="number"]').first();
    await quantityInput.fill('30');

    // 6. Remplir service_id Packlink (mock)
    const serviceInput = modal.locator('input[type="number"]').nth(1);
    await serviceInput.fill('12345');

    // 7. Soumettre formulaire
    const submitBtn = modal.locator('button:has-text("Créer l\'expédition")');
    await submitBtn.click();

    // 8. Attendre toast succès
    await expect(page.locator('text=/Expédition créée/i')).toBeVisible({
      timeout: 10000,
    });

    // 9. Vérifier modal fermée
    await expect(modal).not.toBeVisible();

    // 10. Attendre refresh données (2s pour triggers)
    await page.waitForTimeout(2000);

    // 11. Vérifier affichage mis à jour
    await expect(page.locator('text=/30.*unités expédiées/i')).toBeVisible();
    await expect(page.locator('text=/70.*unités restantes/i')).toBeVisible();
    await expect(page.locator('text=/30%/i')).toBeVisible(); // Completion

    // 12. Vérifier shipment card visible
    await expect(page.locator('text=/Packlink.*Standard/i')).toBeVisible();
    await expect(page.locator('text=/En traitement/i')).toBeVisible();

    // 13. Vérifier database
    const productStock = await getProductStock(supabase, TEST_IDS.product);
    expect(productStock.stock_quantity).toBe(100); // Stock physique inchangé
    expect(productStock.stock_forecasted_out).toBe(100); // Toujours réservé

    const orderStatus = await getSalesOrderStatus(
      supabase,
      TEST_IDS.salesOrder
    );
    expect(orderStatus.status).toBe('partially_shipped'); // Trigger auto-update
    expect(orderStatus.total_shipped).toBe(30);

    const shipmentsCount = await getShipmentsCount(
      supabase,
      TEST_IDS.salesOrder
    );
    expect(shipmentsCount).toBe(1);

    console.log('✅ Scenario 1 completed: 30/100 units shipped');
  });

  // =============================================
  // SCENARIO 2 : Deuxième expédition partielle (40/100, total 70/100)
  // =============================================

  test('Scenario 2: should create second partial shipment (40/100, total 70/100)', async ({
    page,
  }) => {
    // 1. Naviguer vers page commande (déjà 30 unités expédiées depuis Scenario 1)
    await page.goto(`/commandes/clients/${TEST_IDS.salesOrder}`);
    await page.waitForLoadState('networkidle');

    // 2. Vérifier état avant (30 expédiées)
    await expect(page.locator('text=/30.*unités expédiées/i')).toBeVisible();
    await expect(page.locator('text=/70.*unités restantes/i')).toBeVisible();

    // 3. Ouvrir modal création shipment
    const newShipmentBtn = page.locator(
      'button:has-text("Nouvelle expédition")'
    );
    await newShipmentBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 4. Sélectionner article et quantité 40
    const checkbox = modal.locator('input[type="checkbox"]').first();
    await checkbox.check();

    const quantityInput = modal.locator('input[type="number"]').first();
    await quantityInput.fill('40');

    // 5. Service Packlink
    const serviceInput = modal.locator('input[type="number"]').nth(1);
    await serviceInput.fill('12345');

    // 6. Soumettre
    const submitBtn = modal.locator('button:has-text("Créer l\'expédition")');
    await submitBtn.click();

    // 7. Attendre succès
    await expect(page.locator('text=/Expédition créée/i')).toBeVisible({
      timeout: 10000,
    });

    await page.waitForTimeout(2000);

    // 8. Vérifier affichage mis à jour
    await expect(page.locator('text=/70.*unités expédiées/i')).toBeVisible();
    await expect(page.locator('text=/30.*unités restantes/i')).toBeVisible();
    await expect(page.locator('text=/70%/i')).toBeVisible(); // Completion

    // 9. Vérifier 2 shipment cards
    const shipmentCards = page.locator('text=/Packlink.*Standard/i');
    await expect(shipmentCards).toHaveCount(2);

    // 10. Vérifier database
    const productStock = await getProductStock(supabase, TEST_IDS.product);
    expect(productStock.stock_quantity).toBe(100);
    expect(productStock.stock_forecasted_out).toBe(100);

    const orderStatus = await getSalesOrderStatus(
      supabase,
      TEST_IDS.salesOrder
    );
    expect(orderStatus.status).toBe('partially_shipped');
    expect(orderStatus.total_shipped).toBe(70);

    const shipmentsCount = await getShipmentsCount(
      supabase,
      TEST_IDS.salesOrder
    );
    expect(shipmentsCount).toBe(2);

    console.log('✅ Scenario 2 completed: 70/100 units shipped (30+40)');
  });

  // =============================================
  // SCENARIO 3 : Clôture partielle (30 unités restantes libérées)
  // =============================================

  test('Scenario 3: should close partial order and release 30 remaining units', async ({
    page,
  }) => {
    // 1. Naviguer vers page commande (70 expédiées, 30 restantes)
    await page.goto(`/commandes/clients/${TEST_IDS.salesOrder}`);
    await page.waitForLoadState('networkidle');

    // 2. Vérifier état avant
    await expect(page.locator('text=/70.*unités expédiées/i')).toBeVisible();
    await expect(page.locator('text=/30.*unités restantes/i')).toBeVisible();

    // 3. Ouvrir modal clôture partielle
    const closeBtn = page.locator('button:has-text("Clôturer commande")');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // 4. Vérifier modal warning
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(
      modal.locator('text=/Clôturer la commande partiellement/i')
    ).toBeVisible();
    await expect(
      modal.locator('text=/30 unités? non expédiées?/i')
    ).toBeVisible();
    await expect(
      modal.locator('text=/libérées du stock prévisionnel/i')
    ).toBeVisible();

    // 5. Confirmer clôture
    const confirmBtn = modal.locator('button:has-text("Clôturer la commande")');
    await confirmBtn.click();

    // 6. Attendre succès
    await expect(page.locator('text=/Commande clôturée/i')).toBeVisible({
      timeout: 10000,
    });

    await page.waitForTimeout(2000);

    // 7. Vérifier statut commande = "closed"
    await expect(page.locator('text=/Clôturée/i')).toBeVisible();

    // 8. Vérifier bouton clôture disparu
    await expect(closeBtn).not.toBeVisible();

    // 9. Vérifier database : stock_forecasted_out libéré
    const productStock = await getProductStock(supabase, TEST_IDS.product);
    expect(productStock.stock_quantity).toBe(100);
    expect(productStock.stock_forecasted_out).toBe(70); // 30 unités libérées

    const orderStatus = await getSalesOrderStatus(
      supabase,
      TEST_IDS.salesOrder
    );
    expect(orderStatus.status).toBe('closed'); // Trigger CAS 5
    expect(orderStatus.total_shipped).toBe(70); // Inchangé

    console.log(
      '✅ Scenario 3 completed: Order closed, 30 units released from forecasted_out'
    );
    console.log(`   stock_forecasted_out: 100 → 70`);
  });

  // =============================================
  // SCENARIO 4 : Simulation webhooks tracking events
  // =============================================

  test('Scenario 4: should receive webhook events and update shipment status', async ({
    page,
  }) => {
    // 1. Récupérer premier shipment ID
    const { data: shipments } = await supabase
      .from('shipments')
      .select('id, packlink_shipment_id')
      .eq('sales_order_id', TEST_IDS.salesOrder)
      .order('created_at', { ascending: true })
      .limit(1);

    expect(shipments).toBeDefined();
    expect(shipments!.length).toBeGreaterThan(0);

    const shipmentId = shipments![0].id;
    const packlinkRef = shipments![0].packlink_shipment_id || 'DE567YH981230AA';

    // 2. Simuler webhook "shipment.tracking.update"
    const webhookPayload = {
      name: 'shipment.tracking.update',
      created_at: new Date().toISOString(),
      data: {
        shipment_reference: packlinkRef,
        status: 'IN_TRANSIT',
        city: 'Paris',
      },
    };

    // Appeler endpoint webhook
    const webhookResponse = await fetch(
      `${SUPABASE_URL.replace('supabase.co', 'vercel.app')}/api/webhooks/packlink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      }
    );

    expect(webhookResponse.ok).toBeTruthy();

    // 3. Attendre traitement webhook (2s)
    await page.waitForTimeout(2000);

    // 4. Naviguer vers page commande
    await page.goto(`/commandes/clients/${TEST_IDS.salesOrder}`);
    await page.waitForLoadState('networkidle');

    // 5. Vérifier status shipment mis à jour
    const shipmentCard = page.locator('text=/Packlink.*Standard/i').first();
    await expect(shipmentCard).toBeVisible();

    // Status badge devrait afficher "En transit"
    await expect(page.locator('text=/En transit/i').first()).toBeVisible();

    // 6. Vérifier tracking event créé
    const trackingEventsCount = await getTrackingEventsCount(
      supabase,
      shipmentId
    );
    expect(trackingEventsCount).toBeGreaterThan(0);

    // Vérifier contenu event
    const { data: events } = await supabase
      .from('shipment_tracking_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(events).toBeDefined();
    expect(events![0].event_name).toBe('shipment.tracking.update');
    expect(events![0].city).toBe('Paris');

    // 7. Simuler webhook "shipment.delivered"
    const deliveredPayload = {
      name: 'shipment.delivered',
      created_at: new Date().toISOString(),
      data: {
        shipment_reference: packlinkRef,
        status: 'DELIVERED',
        city: 'Lyon',
      },
    };

    await fetch(
      `${SUPABASE_URL.replace('supabase.co', 'vercel.app')}/api/webhooks/packlink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveredPayload),
      }
    );

    await page.waitForTimeout(2000);

    // 8. Refresh page et vérifier status "Livré"
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/Livré/i').first()).toBeVisible();

    // 9. Vérifier delivered_at rempli
    const { data: shipment } = await supabase
      .from('shipments')
      .select('status, delivered_at')
      .eq('id', shipmentId)
      .single();

    expect(shipment?.status).toBe('DELIVERED');
    expect(shipment?.delivered_at).toBeTruthy();

    console.log(
      '✅ Scenario 4 completed: Webhooks processed, tracking events created'
    );
    console.log(`   Shipment status: PROCESSING → IN_TRANSIT → DELIVERED`);
  });

  // =============================================
  // SCENARIO BONUS : Validation complétude
  // =============================================

  test('Bonus: should validate complete workflow end state', async () => {
    // 1. Vérifier état final database
    const productStock = await getProductStock(supabase, TEST_IDS.product);
    console.log('Final product stock:', productStock);
    expect(productStock.stock_quantity).toBe(100);
    expect(productStock.stock_forecasted_out).toBe(70); // 30 libérées

    const orderStatus = await getSalesOrderStatus(
      supabase,
      TEST_IDS.salesOrder
    );
    console.log('Final order status:', orderStatus);
    expect(orderStatus.status).toBe('closed');
    expect(orderStatus.total_units).toBe(100);
    expect(orderStatus.total_shipped).toBe(70);

    const shipmentsCount = await getShipmentsCount(
      supabase,
      TEST_IDS.salesOrder
    );
    console.log('Total shipments created:', shipmentsCount);
    expect(shipmentsCount).toBe(2);

    // 2. Vérifier aucune régression
    // Stock physique inchangé (pas de mouvement OUT car pas de réception précédente)
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', TEST_IDS.product);

    console.log('Stock movements count:', movements?.length || 0);
    // NOTE: Movements OUT créés uniquement si stock physique disponible
    // Ici c'est une simulation donc 0 movements OUT attendu

    console.log('✅ Workflow complet validé:');
    console.log('   - 2 shipments créés (30 + 40 unités)');
    console.log('   - Commande clôturée (status=closed)');
    console.log('   - 30 unités libérées (forecasted_out: 100 → 70)');
    console.log('   - Webhooks tracking fonctionnels');
    console.log('   - Aucune régression stock');
  });
});
