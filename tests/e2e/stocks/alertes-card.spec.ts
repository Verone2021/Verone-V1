/**
 * Tests E2E : Composant StockAlertCard - Couleurs dynamiques
 * Phase 3 : Tests validation
 * Date : 2025-11-10
 *
 * Tests Phase 2.1 : Couleurs ROUGE → VERT → DISPARAÎT
 * - validated=true → VERT
 * - is_in_draft=true → ROUGE
 * - Couleurs sévérité par défaut
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import {
  seedStockAlertsTestData,
  cleanupStockAlertsTestData,
  TEST_IDS,
  createTestDraftOrder,
} from '../../fixtures/stock-alerts-test-data';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

test.describe('StockAlertCard - Couleurs Dynamiques', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await seedStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test.afterAll(async () => {
    await cleanupStockAlertsTestData(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  test.beforeEach(async ({ page }) => {
    // Naviguer vers page alertes
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');

    // Vérifier que la page est chargée
    await expect(page.locator('h1')).toContainText('Alertes Stock');
  });

  test('should display alert card with RED color when in draft', async ({
    page,
  }) => {
    // Créer commande draft pour produit low_stock
    await createTestDraftOrder(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      TEST_IDS.product_low_stock,
      10
    );

    // Rafraîchir page pour voir changement
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Trouver card pour produit TEST-LOW-001
    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-LOW-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier couleur ROUGE (border-red-600 bg-red-50)
    await expect(card).toHaveClass(/border-red-600/);
    await expect(card).toHaveClass(/bg-red-50/);

    // Vérifier badge "Déjà commandé" visible
    const badge = card.locator('text=/Déjà commandé|Commandé/');
    await expect(badge).toBeVisible();

    // Vérifier bouton disabled
    const button = card.locator('button:has-text("Commander")');
    await expect(button).toBeDisabled();
  });

  test('should display alert card with GREEN color when validated', async ({
    page,
  }) => {
    // Créer et valider commande pour produit out_stock
    const order = await createTestDraftOrder(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      TEST_IDS.product_out_stock,
      15
    );

    // Valider la commande
    await supabase
      .from('purchase_orders')
      .update({ status: 'validated' })
      .eq('id', order.id);

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

    // Trouver card pour produit TEST-OUT-001
    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-OUT-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier couleur VERTE (border-green-600 bg-green-50)
    await expect(card).toHaveClass(/border-green-600/);
    await expect(card).toHaveClass(/bg-green-50/);

    // Vérifier texte indiquant validation
    const text = card.locator('text=/Validé|En attente/i');
    await expect(text).toBeVisible();
  });

  test('should display alert card with CRITICAL RED color by default', async ({
    page,
  }) => {
    // Produit TEST-OUT-001 avec severity=critical, pas de draft
    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-OUT-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier couleur ROUGE sévérité critical
    await expect(card).toHaveClass(/border-red-600/);
    await expect(card).toHaveClass(/bg-red-50/);

    // Vérifier icône critical (XCircle)
    const criticalIcon = card.locator('svg.lucide-x-circle');
    await expect(criticalIcon).toBeVisible();
  });

  test('should display alert card with WARNING ORANGE color for low stock', async ({
    page,
  }) => {
    // Produit TEST-LOW-001 avec severity=warning
    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-LOW-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier couleur ORANGE (border-orange-600 bg-orange-50)
    await expect(card).toHaveClass(/border-orange-600/);
    await expect(card).toHaveClass(/bg-orange-50/);

    // Vérifier icône warning (AlertTriangle)
    const warningIcon = card.locator('svg.lucide-alert-triangle');
    await expect(warningIcon).toBeVisible();
  });

  test('should display product image or placeholder', async ({ page }) => {
    const card = page.locator('[data-testid="stock-alert-card"]').first();
    await expect(card).toBeVisible();

    // Vérifier présence image OU placeholder
    const hasImage = await card.locator('img').count();
    const hasPlaceholder = await card.locator('svg.lucide-package').count();

    expect(hasImage + hasPlaceholder).toBeGreaterThan(0);
  });

  test('should display shortage quantity correctly', async ({ page }) => {
    // Produit TEST-LOW-001 avec shortage=5
    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-LOW-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier affichage stock info
    await expect(card.locator('text=/Stock:.*5/')).toBeVisible();
    await expect(card.locator('text=/Seuil:.*10/')).toBeVisible();
  });

  test('should have functional "Voir Produit" link', async ({
    page,
    context,
  }) => {
    const card = page.locator('[data-testid="stock-alert-card"]').first();
    await expect(card).toBeVisible();

    // Cliquer sur lien "Voir Produit"
    const link = card.locator('a:has-text("Voir Produit")');
    await expect(link).toBeVisible();

    // Vérifier href commence par /catalogue/
    await expect(link).toHaveAttribute('href', /\/catalogue\//);
  });

  test('should display badge with draft order number when in draft', async ({
    page,
  }) => {
    // Créer commande draft
    const order = await createTestDraftOrder(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      TEST_IDS.product_low_stock,
      10
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-LOW-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier badge avec numéro commande
    const badge = card.locator(`text=${order.po_number}`);
    await expect(badge).toBeVisible();
  });

  test('should display quantity in draft correctly', async ({ page }) => {
    // Créer commande draft avec quantité spécifique
    await createTestDraftOrder(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      TEST_IDS.product_low_stock,
      25
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-LOW-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier affichage "Commandé: 25"
    await expect(card.locator('text=/Commandé:.*25/')).toBeVisible();
  });

  test('should display related sales orders for no_stock_but_ordered type', async ({
    page,
  }) => {
    // Produit TEST-ORDERED-001 avec commandes clients en attente
    const card = page
      .locator('[data-testid="stock-alert-card"]', {
        has: page.locator('text=TEST-ORDERED-001'),
      })
      .first();

    await expect(card).toBeVisible();

    // Vérifier type alerte "Commandé Sans Stock"
    await expect(card.locator('text=/Commandé Sans Stock/i')).toBeVisible();

    // Vérifier affichage forecasted_out
    await expect(card.locator('text=/Réservé:.*5/')).toBeVisible();
  });

  test('should NOT display alert when conditions resolved', async ({
    page,
  }) => {
    // Résoudre condition alerte : augmenter stock au-dessus min_stock
    await supabase
      .from('products')
      .update({ stock_real: 15 }) // Au-dessus de min_stock=10
      .eq('id', TEST_IDS.product_low_stock);

    // Le trigger sync_stock_alert_tracking devrait supprimer l'alerte
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Attendre que l'alerte disparaisse
    await page.waitForTimeout(1000);

    // Vérifier que la card n'est plus visible
    const card = page.locator('[data-testid="stock-alert-card"]', {
      has: page.locator('text=TEST-LOW-001'),
    });

    await expect(card).not.toBeVisible();

    // Restaurer valeur initiale pour autres tests
    await supabase
      .from('products')
      .update({ stock_real: 5 })
      .eq('id', TEST_IDS.product_low_stock);
  });
});
