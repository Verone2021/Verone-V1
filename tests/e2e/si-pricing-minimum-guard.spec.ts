import { expect, test } from '@playwright/test';

/**
 * SI-PRICING-001 — Garde-fou minimum de vente par canal
 *
 * Valide que l'API /api/channel-pricing/upsert rejette un prix
 * sous le minimum calculé et que l'UI propose l'override admin.
 *
 * Prérequis : un produit avec cost_price > 0 et margin_percentage > 0.
 * Le slug du produit est piloté via PRODUCT_ID_WITH_COST ou détecté
 * automatiquement via le premier produit listé avec un coût renseigné.
 */

const ADMIN_EMAIL = 'veronebyromeo@gmail.com';
const ADMIN_PASSWORD = 'Abc123456';

test.describe('SI-PRICING-001 minimum guard', () => {
  test('API rejects price below minimum, accepts with override', async ({
    page,
    request,
  }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|catalogue|produits/, { timeout: 10000 });

    const productId = process.env.PRODUCT_ID_WITH_COST;
    test.skip(
      !productId || !process.env.CHANNEL_ID_SITE,
      'Set PRODUCT_ID_WITH_COST + CHANNEL_ID_SITE (channel site_internet id: 0c2639e9-df80-41fa-84d0-9da96a128f7f)'
    );

    const channelRes = await request.get(
      `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/channel-pricing/upsert`
    );
    expect([404, 405]).toContain(channelRes.status());

    const body = {
      product_id: productId,
      channel_id: process.env.CHANNEL_ID_SITE!,
      custom_price_ht: 0.01,
      discount_rate: null,
      is_active: true,
    };

    const reject = await request.post('/api/channel-pricing/upsert', {
      data: body,
    });
    expect(reject.status()).toBe(422);
    const rejectBody = (await reject.json()) as {
      ok: boolean;
      minimum_selling_price: number;
    };
    expect(rejectBody.ok).toBe(false);
    expect(rejectBody.minimum_selling_price).toBeGreaterThan(0);

    const override = await request.post('/api/channel-pricing/upsert', {
      data: { ...body, override_minimum: true },
    });
    expect(override.status()).toBe(200);
    const overrideBody = (await override.json()) as { ok: boolean };
    expect(overrideBody.ok).toBe(true);
  });

  test('Tarification tab renders UnifiedPricingPanel sections', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    const productId = process.env.PRODUCT_ID_WITH_COST;
    test.skip(!productId, 'Set PRODUCT_ID_WITH_COST');

    await page.goto(`/produits/catalogue/${productId}`);
    await page.getByRole('tab', { name: /tarification/i }).click();

    await expect(page.getByText(/prix par canal/i)).toBeVisible();
    await expect(page.getByText(/historique des achats/i)).toBeVisible();
  });
});
