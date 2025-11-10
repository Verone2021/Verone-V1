/**
 * Tests Database : Validations migrations SQL alertes stock
 * Phase 3 : Tests validation
 * Date : 2025-11-10
 *
 * Tests des migrations :
 * - 20251110_002: Fix trigger track_product_removed_from_draft
 * - 20251110_003: Fix calcul shortage_quantity
 * - 20251110_004: Cleanup alertes validées
 * - 20251110_005: Support MOQ fournisseur
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import {
  seedStockAlertsTestData,
  cleanupStockAlertsTestData,
  testProducts,
  TEST_IDS,
} from '../fixtures/stock-alerts-test-data';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

test.describe('Migrations SQL - Alertes Stock', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await seedStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test.afterAll(async () => {
    await cleanupStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test.describe('Migration 003 - Calcul shortage_quantity', () => {
    test('should calculate shortage for out_of_stock correctly', async () => {
      // Produit avec stock_real = 0, min_stock = 10
      // Formule: shortage = abs(stock_real) + min_stock = 0 + 10 = 10

      const { data: alert } = await supabase
        .from('stock_alert_tracking')
        .select('shortage_quantity, alert_type')
        .eq('product_id', TEST_IDS.product_out_stock)
        .single();

      expect(alert).toBeTruthy();
      expect(alert?.alert_type).toBe('out_of_stock');
      expect(alert?.shortage_quantity).toBe(10); // abs(0) + 10 = 10
    });

    test('should calculate shortage for low_stock correctly', async () => {
      // Produit avec stock_real = 5, min_stock = 10
      // Formule: shortage = min_stock - stock_real = 10 - 5 = 5

      const { data: alert } = await supabase
        .from('stock_alert_tracking')
        .select('shortage_quantity, alert_type')
        .eq('product_id', TEST_IDS.product_low_stock)
        .single();

      expect(alert).toBeTruthy();
      expect(alert?.alert_type).toBe('low_stock');
      expect(alert?.shortage_quantity).toBe(5); // 10 - 5 = 5
    });

    test('should calculate shortage for no_stock_but_ordered correctly (FIX 2.3)', async () => {
      // Produit avec stock_real = 0, stock_forecasted_out = 5, min_stock = 10
      // Formule CORRIGÉE: shortage = forecasted_out + min_stock = 5 + 10 = 15
      // (AVANT le fix, c'était juste forecasted_out = 5)

      const { data: alert } = await supabase
        .from('stock_alert_tracking')
        .select('shortage_quantity, alert_type')
        .eq('product_id', TEST_IDS.product_ordered)
        .single();

      expect(alert).toBeTruthy();
      expect(alert?.alert_type).toBe('no_stock_but_ordered');
      expect(alert?.shortage_quantity).toBe(15); // ✅ 5 + 10 = 15 (FIX Phase 2.3)
    });

    test('should handle NULL min_stock with COALESCE', async () => {
      // Créer produit test avec min_stock NULL
      const testProductNullMinStock = {
        id: 'test-null-min-stock-uuid',
        name: 'Test Null Min Stock',
        sku: 'TEST-NULL-001',
        stock_real: 0,
        stock_forecasted_out: 5,
        min_stock: null,
        supplier_moq: 1,
        cost_price: 500,
      };

      await supabase.from('products').insert(testProductNullMinStock);

      const { data: alert } = await supabase
        .from('stock_alert_tracking')
        .select('shortage_quantity')
        .eq('product_id', testProductNullMinStock.id)
        .single();

      expect(alert).toBeTruthy();
      // COALESCE(NULL, 0) = 0 → shortage = 5 + 0 = 5
      expect(alert?.shortage_quantity).toBe(5);

      // Cleanup
      await supabase
        .from('products')
        .delete()
        .eq('id', testProductNullMinStock.id);
    });
  });

  test.describe('Migration 004 - Cleanup alertes validées', () => {
    test('should return cleanup candidates older than threshold', async () => {
      // Créer alerte validée ancienne (>30 jours)
      const oldAlert = {
        product_id: TEST_IDS.product_low_stock,
        alert_type: 'low_stock',
        alert_priority: 2,
        stock_real: 5,
        stock_forecasted_out: 0,
        min_stock: 10,
        shortage_quantity: 5,
        validated: true,
        validated_at: new Date(
          Date.now() - 35 * 24 * 60 * 60 * 1000
        ).toISOString(), // 35 jours
      };

      await supabase
        .from('stock_alert_tracking')
        .upsert(oldAlert, { onConflict: 'product_id' });

      // Appeler fonction get_cleanup_candidates
      const { data: candidates } = await supabase.rpc(
        'get_cleanup_candidates',
        {
          p_days_threshold: 30,
        }
      );

      expect(candidates).toBeTruthy();
      expect(Array.isArray(candidates)).toBe(true);
      expect(candidates!.length).toBeGreaterThan(0);

      const candidate = candidates!.find(
        (c: any) => c.product_id === TEST_IDS.product_low_stock
      );
      expect(candidate).toBeTruthy();
      expect(candidate.days_since_validation).toBeGreaterThan(30);
    });

    test('should cleanup validated alerts older than threshold', async () => {
      // Appeler fonction cleanup_validated_alerts
      const { data: result } = await supabase.rpc('cleanup_validated_alerts', {
        p_days_threshold: 30,
      });

      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);

      if (result && result.length > 0) {
        const { deleted_count } = result[0];
        expect(deleted_count).toBeGreaterThan(0);
      }

      // Vérifier que l'alerte a été supprimée
      const { data: alert } = await supabase
        .from('stock_alert_tracking')
        .select()
        .eq('product_id', TEST_IDS.product_low_stock)
        .eq('validated', true)
        .maybeSingle();

      expect(alert).toBeNull();
    });

    test('should NOT cleanup validated alerts within threshold', async () => {
      // Créer alerte validée récente (<30 jours)
      const recentAlert = {
        product_id: TEST_IDS.product_out_stock,
        alert_type: 'out_of_stock',
        alert_priority: 3,
        stock_real: 0,
        stock_forecasted_out: 0,
        min_stock: 10,
        shortage_quantity: 10,
        validated: true,
        validated_at: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString(), // 15 jours
      };

      await supabase
        .from('stock_alert_tracking')
        .upsert(recentAlert, { onConflict: 'product_id' });

      // Appeler cleanup
      await supabase.rpc('cleanup_validated_alerts', {
        p_days_threshold: 30,
      });

      // Vérifier que l'alerte récente est toujours présente
      const { data: alert } = await supabase
        .from('stock_alert_tracking')
        .select()
        .eq('product_id', TEST_IDS.product_out_stock)
        .eq('validated', true)
        .single();

      expect(alert).toBeTruthy();

      // Cleanup
      await supabase
        .from('stock_alert_tracking')
        .delete()
        .eq('product_id', TEST_IDS.product_out_stock);
    });
  });

  test.describe('Migration 005 - Support MOQ fournisseur', () => {
    test('should have supplier_moq column with default value 1', async () => {
      const { data: product } = await supabase
        .from('products')
        .select('supplier_moq')
        .eq('id', TEST_IDS.product_low_stock)
        .single();

      expect(product).toBeTruthy();
      expect(product?.supplier_moq).toBe(1); // Default value
    });

    test('should store custom MOQ values', async () => {
      const { data: product } = await supabase
        .from('products')
        .select('supplier_moq')
        .eq('id', TEST_IDS.product_moq_high)
        .single();

      expect(product).toBeTruthy();
      expect(product?.supplier_moq).toBe(20); // Custom MOQ
    });

    test('should enforce constraint supplier_moq >= 1', async () => {
      const invalidProduct = {
        id: 'test-invalid-moq-uuid',
        name: 'Test Invalid MOQ',
        sku: 'TEST-INVALID-MOQ',
        supplier_moq: 0, // ❌ Invalide (constraint)
        cost_price: 500,
      };

      const { error } = await supabase.from('products').insert(invalidProduct);

      expect(error).toBeTruthy();
      expect(error?.message).toContain('chk_supplier_moq_positive');
    });

    test('should have partial index on supplier_moq > 1', async () => {
      // Query utilisant l'index
      const { data: products } = await supabase
        .from('products')
        .select('id, supplier_moq')
        .gt('supplier_moq', 1);

      expect(products).toBeTruthy();
      expect(Array.isArray(products)).toBe(true);

      const highMoqProduct = products?.find(
        p => p.id === TEST_IDS.product_moq_high
      );
      expect(highMoqProduct).toBeTruthy();
      expect(highMoqProduct?.supplier_moq).toBe(20);
    });
  });

  test.describe('Migration 002 - Fix trigger track_product_removed_from_draft', () => {
    test('should NOT throw MAX(uuid) error when removing product from draft', async () => {
      // Créer commande draft avec 2 items
      const draftOrder = {
        id: 'test-draft-trigger-uuid',
        supplier_id: testProducts.lowStock.supplier_id,
        status: 'draft',
        po_number: 'PO-TEST-TRIGGER',
      };

      await supabase.from('purchase_orders').insert(draftOrder);

      // Ajouter 2 items (même produit)
      const items = [
        {
          purchase_order_id: draftOrder.id,
          product_id: TEST_IDS.product_low_stock,
          quantity: 5,
          unit_price: 500,
        },
        {
          purchase_order_id: draftOrder.id,
          product_id: TEST_IDS.product_out_stock,
          quantity: 10,
          unit_price: 600,
        },
      ];

      const { data: insertedItems } = await supabase
        .from('purchase_order_items')
        .insert(items)
        .select();

      expect(insertedItems).toBeTruthy();
      expect(insertedItems!.length).toBe(2);

      // Supprimer un item → Trigger devrait s'exécuter SANS erreur MAX(uuid)
      const { error: deleteError } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', insertedItems![0].id);

      // ✅ Pas d'erreur = fix fonctionne
      expect(deleteError).toBeNull();

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', draftOrder.id);
    });

    test('should update stock_alert_tracking after removing product from draft', async () => {
      // Créer commande draft
      const draftOrder = {
        id: 'test-draft-update-uuid',
        supplier_id: testProducts.lowStock.supplier_id,
        status: 'draft',
        po_number: 'PO-TEST-UPDATE',
      };

      await supabase.from('purchase_orders').insert(draftOrder);

      // Ajouter item
      const { data: item } = await supabase
        .from('purchase_order_items')
        .insert({
          purchase_order_id: draftOrder.id,
          product_id: TEST_IDS.product_low_stock,
          quantity: 10,
          unit_price: 500,
        })
        .select()
        .single();

      // Vérifier alerte updated avec draft_order_id
      const { data: alertBefore } = await supabase
        .from('stock_alert_tracking')
        .select('draft_order_id, quantity_in_draft')
        .eq('product_id', TEST_IDS.product_low_stock)
        .single();

      expect(alertBefore?.draft_order_id).toBe(draftOrder.id);
      expect(alertBefore?.quantity_in_draft).toBe(10);

      // Supprimer item
      await supabase.from('purchase_order_items').delete().eq('id', item!.id);

      // Vérifier alerte réinitialisée (plus de draft)
      const { data: alertAfter } = await supabase
        .from('stock_alert_tracking')
        .select('draft_order_id, quantity_in_draft')
        .eq('product_id', TEST_IDS.product_low_stock)
        .single();

      expect(alertAfter?.draft_order_id).toBeNull();
      expect(alertAfter?.quantity_in_draft).toBe(0);

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', draftOrder.id);
    });
  });
});
