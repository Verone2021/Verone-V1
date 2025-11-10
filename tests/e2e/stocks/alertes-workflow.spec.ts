/**
 * Tests E2E : Workflow Complet Alertes Stock
 * Phase 3 : Tests validation
 * Date : 2025-11-10
 *
 * Tests workflow ROUGE → VERT → DISPARAÎT
 * - Auto-open modal depuis notification (Phase 2.2)
 * - Création commande draft → ROUGE
 * - Validation commande → VERT
 * - Réception commande → DISPARAÎT
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import {
  seedStockAlertsTestData,
  cleanupStockAlertsTestData,
  TEST_IDS,
} from '../../fixtures/stock-alerts-test-data';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

test.describe('Workflow Complet Alertes Stock', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await seedStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test.afterAll(async () => {
    await cleanupStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test('should auto-open modal from notification URL (Phase 2.2)', async ({
    page,
  }) => {
    // Naviguer avec paramètre ?product_id=
    await page.goto(`/stocks/alertes?product_id=${TEST_IDS.product_low_stock}`);
    await page.waitForLoadState('networkidle');

    // ✅ Modal devrait s'ouvrir automatiquement
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Vérifier contenu modal correspond au produit
    await expect(modal.locator('text=/Canapé Test Low Stock/i')).toBeVisible();
    await expect(modal.locator('text=TEST-LOW-001')).toBeVisible();

    // Fermer modal
    await page.locator('button:has-text("Annuler")').click();
    await expect(modal).not.toBeVisible();
  });

  test('should NOT auto-open modal if product_id not in URL', async ({
    page,
  }) => {
    // Naviguer sans paramètre
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Modal ne devrait PAS s'ouvrir
    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible();
  });

  test('should NOT auto-open modal if alert already in draft', async ({
    page,
  }) => {
    // Créer commande draft pour le produit
    const draftOrder = {
      id: 'test-workflow-draft-uuid',
      supplier_id: (
        await supabase
          .from('products')
          .select('supplier_id')
          .eq('id', TEST_IDS.product_low_stock)
          .single()
      ).data?.supplier_id,
      status: 'draft',
      po_number: 'PO-TEST-WORKFLOW',
    };

    await supabase.from('purchase_orders').insert(draftOrder);

    await supabase.from('purchase_order_items').insert({
      purchase_order_id: draftOrder.id,
      product_id: TEST_IDS.product_low_stock,
      quantity: 10,
      unit_price: 500,
    });

    // Attendre trigger
    await page.waitForTimeout(2000);

    // Naviguer avec product_id
    await page.goto(`/stocks/alertes?product_id=${TEST_IDS.product_low_stock}`);
    await page.waitForLoadState('networkidle');

    // Modal ne devrait PAS s'ouvrir (déjà en draft)
    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible();

    // Cleanup
    await supabase.from('purchase_orders').delete().eq('id', draftOrder.id);
  });

  test('WORKFLOW COMPLET: ROUGE → VERT → DISPARAÎT', async ({ page }) => {
    // ========== ÉTAT INITIAL : Alerte sans commande ==========
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-OUT-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier couleur initiale (sévérité critical = rouge)
    await expect(card).toHaveClass(/border-red-600/);
    await expect(card).toHaveClass(/bg-red-50/);

    // ========== ÉTAPE 1 : Créer commande draft → ROUGE ==========
    const buttonCommander = card.locator('button:has-text("Commander")');
    await expect(buttonCommander).toBeEnabled();
    await buttonCommander.click();

    // Modal s'ouvre
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Remplir quantité
    const quantityInput = modal.locator('input[type="number"]').first();
    await quantityInput.fill('15');

    // Soumettre
    await modal.locator('button:has-text("Ajouter")').click();

    // Attendre fermeture modal et mise à jour DB
    await expect(modal).not.toBeVisible();
    await page.waitForTimeout(2000);

    // Rafraîchir page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ✅ Vérifier carte ROUGE (draft créé)
    const cardAfterDraft = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-OUT-001'),
      })
      .first();

    await expect(cardAfterDraft).toBeVisible();
    await expect(cardAfterDraft).toHaveClass(/border-red-600/);
    await expect(cardAfterDraft).toHaveClass(/bg-red-50/);

    // Vérifier badge "Déjà commandé" visible
    await expect(
      cardAfterDraft.locator('text=/Déjà commandé|Commandé/i')
    ).toBeVisible();

    // Vérifier bouton disabled
    await expect(
      cardAfterDraft.locator('button:has-text("Commander")')
    ).toBeDisabled();

    // ========== ÉTAPE 2 : Valider commande → VERT ==========

    // Récupérer ID commande créée
    const { data: alert } = await supabase
      .from('stock_alert_tracking')
      .select('draft_order_id')
      .eq('product_id', TEST_IDS.product_out_stock)
      .single();

    expect(alert?.draft_order_id).toBeTruthy();

    // Valider la commande
    await supabase
      .from('purchase_orders')
      .update({ status: 'validated' })
      .eq('id', alert!.draft_order_id);

    // Mettre à jour alerte comme validée
    await supabase
      .from('stock_alert_tracking')
      .update({
        validated: true,
        validated_at: new Date().toISOString(),
      })
      .eq('product_id', TEST_IDS.product_out_stock);

    // Rafraîchir page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ✅ Vérifier carte VERTE (validée)
    const cardAfterValidation = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-OUT-001'),
      })
      .first();

    await expect(cardAfterValidation).toBeVisible();
    await expect(cardAfterValidation).toHaveClass(/border-green-600/);
    await expect(cardAfterValidation).toHaveClass(/bg-green-50/);

    // ========== ÉTAPE 3 : Réceptionner commande → DISPARAÎT ==========

    // Augmenter stock_real au-dessus de min_stock (condition résolue)
    await supabase
      .from('products')
      .update({ stock_real: 20 }) // > min_stock=10
      .eq('id', TEST_IDS.product_out_stock);

    // Le trigger sync_stock_alert_tracking() devrait supprimer l'alerte
    await page.waitForTimeout(2000);

    // Rafraîchir page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ✅ Vérifier carte DISPARUE
    const cardAfterReception = page.locator(
      '[data-testid="stock-alert-card"]',
      {
        has: page.locator('text=TEST-OUT-001'),
      }
    );

    await expect(cardAfterReception).not.toBeVisible();

    // Vérifier alerte supprimée de la DB
    const { data: alertAfter } = await supabase
      .from('stock_alert_tracking')
      .select()
      .eq('product_id', TEST_IDS.product_out_stock)
      .maybeSingle();

    expect(alertAfter).toBeNull();

    // ========== CLEANUP : Restaurer état initial ==========
    await supabase
      .from('products')
      .update({ stock_real: 0 })
      .eq('id', TEST_IDS.product_out_stock);

    // Supprimer commande
    if (alert?.draft_order_id) {
      await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', alert.draft_order_id);
    }
  });

  test('should handle order cancellation → restore alert', async ({ page }) => {
    // Créer commande draft
    const { data: product } = await supabase
      .from('products')
      .select('supplier_id')
      .eq('id', TEST_IDS.product_low_stock)
      .single();

    const draftOrder = {
      id: 'test-cancel-order-uuid',
      supplier_id: product?.supplier_id,
      status: 'draft',
      po_number: 'PO-TEST-CANCEL',
    };

    await supabase.from('purchase_orders').insert(draftOrder);

    await supabase.from('purchase_order_items').insert({
      purchase_order_id: draftOrder.id,
      product_id: TEST_IDS.product_low_stock,
      quantity: 10,
      unit_price: 500,
    });

    await page.waitForTimeout(2000);

    // Naviguer vers page alertes
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Vérifier carte ROUGE (draft)
    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-LOW-001'),
      })
      .first();

    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/border-red-600/);

    // Annuler/supprimer la commande
    await supabase.from('purchase_orders').delete().eq('id', draftOrder.id);

    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ✅ Vérifier alerte RESTAURÉE (plus de draft_order_id)
    const { data: alert } = await supabase
      .from('stock_alert_tracking')
      .select('draft_order_id, quantity_in_draft')
      .eq('product_id', TEST_IDS.product_low_stock)
      .single();

    expect(alert?.draft_order_id).toBeNull();
    expect(alert?.quantity_in_draft).toBe(0);

    // Bouton "Commander" devrait être réactivé
    const cardAfterCancel = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-LOW-001'),
      })
      .first();

    await expect(cardAfterCancel).toBeVisible();
    await expect(
      cardAfterCancel.locator('button:has-text("Commander")')
    ).toBeEnabled();
  });

  test('should cleanup validated alerts after 30 days', async ({ page }) => {
    // Créer alerte validée ancienne (>30 jours)
    const oldValidatedAlert = {
      product_id: TEST_IDS.product_ordered,
      alert_type: 'no_stock_but_ordered',
      alert_priority: 3,
      stock_real: 0,
      stock_forecasted_out: 5,
      min_stock: 10,
      shortage_quantity: 15,
      validated: true,
      validated_at: new Date(
        Date.now() - 35 * 24 * 60 * 60 * 1000
      ).toISOString(), // 35 jours
    };

    await supabase
      .from('stock_alert_tracking')
      .upsert(oldValidatedAlert, { onConflict: 'product_id' });

    // Appeler fonction cleanup
    await supabase.rpc('cleanup_validated_alerts', {
      p_days_threshold: 30,
    });

    // Vérifier alerte supprimée
    const { data: alertAfter } = await supabase
      .from('stock_alert_tracking')
      .select()
      .eq('product_id', TEST_IDS.product_ordered)
      .eq('validated', true)
      .maybeSingle();

    expect(alertAfter).toBeNull();

    // Naviguer vers page alertes
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Vérifier carte n'est plus visible
    const card = page.locator('[data-testid="stock-alert-card"]', {
      has: page.locator('text=TEST-ORDERED-001'),
    });

    await expect(card).not.toBeVisible();
  });

  test('should handle multiple alerts simultaneously', async ({ page }) => {
    // Vérifier que plusieurs alertes peuvent coexister
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Compter nombre d'alertes affichées
    const cards = page.locator('[data-testid="stock-alert-card"]');
    const count = await cards.count();

    // Devrait y avoir au moins 3 alertes (low_stock, out_stock, ordered)
    expect(count).toBeGreaterThanOrEqual(3);

    // Vérifier chaque carte a un SKU unique
    const skus = await cards.locator('text=/TEST-/').allTextContents();
    const uniqueSkus = new Set(skus);

    expect(uniqueSkus.size).toBe(count);
  });

  test('should filter alerts by severity', async ({ page }) => {
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Ouvrir filtres (si disponible)
    const filterButton = page.locator('button:has-text("Filtrer")');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Sélectionner sévérité "critical"
      const severitySelect = page.locator('select[name="severity"]');
      await severitySelect.selectOption('critical');

      // Vérifier que seules alertes critical sont affichées
      const cards = page.locator('[data-testid="stock-alert-card"]');
      const count = await cards.count();

      expect(count).toBeGreaterThan(0);

      // Toutes les cartes devraient avoir icône XCircle (critical)
      const criticalIcons = await cards.locator('svg.lucide-x-circle').count();
      expect(criticalIcons).toBe(count);
    }
  });
});
