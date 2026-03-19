/**
 * Tests unitaires - Calculs de marge LinkMe
 *
 * Exécution: npx tsx packages/@verone/utils/src/linkme/__tests__/margin-calculation.test.ts
 *
 * Vérifie que les calculs de marge utilisent le TAUX DE MARGE ADDITIF correct:
 * - selling_price = base_price * (1 + margin_rate/100)
 * - gain = selling_price - base_price
 *
 * @module margin-calculation.test
 * @since 2026-01-21
 */

import { strict as assert } from 'node:assert';

import {
  calculateMargin,
  calculateGainFromSellingPrice,
  calculateMarginRateFromPrices,
  calculateAffiliateCommission,
  calculateCartTotals,
  formatEuros,
  formatPercent,
} from '../margin-calculation';

// ============================================================================
// HELPERS
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(
      `     ${error instanceof Error ? error.message : String(error)}`
    );
    failed++;
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

// ============================================================================
// TESTS: calculateMargin
// ============================================================================

describe('calculateMargin (taux de marge additif)', () => {
  test('calcule correctement avec marge 15% (cas standard)', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 15 });

    // selling_price = 100 * (1 + 0.15) = 100 * 1.15 = 115.00
    assert.strictEqual(result.sellingPriceHt, 115);
    // gain = 115 - 100 = 15.00
    assert.strictEqual(result.gainEuros, 15);
    assert.strictEqual(result.marginRate, 15);
  });

  test('calcule correctement avec marge 10%', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 10 });

    // selling_price = 100 * 1.10 = 110.00
    assert.strictEqual(result.sellingPriceHt, 110);
    assert.strictEqual(result.gainEuros, 10);
  });

  test('calcule correctement avec marge 20%', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 20 });

    // selling_price = 100 * 1.20 = 120.00
    assert.strictEqual(result.sellingPriceHt, 120);
    assert.strictEqual(result.gainEuros, 20);
  });

  test('gère margin_rate = 0 (pas de marge)', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 0 });

    assert.strictEqual(result.sellingPriceHt, 100);
    assert.strictEqual(result.gainEuros, 0);
  });

  test('gère les prix avec décimales (ex: 20.19€)', () => {
    // Cas réel: Plateau bois 20x30 à 20.19€ avec marge 15%
    const result = calculateMargin({ basePriceHt: 20.19, marginRate: 15 });

    // selling_price = 20.19 * 1.15 = 23.2185 → 23.22
    assert.strictEqual(result.sellingPriceHt, 23.22);
    // gain = 23.22 - 20.19 = 3.03
    assert.strictEqual(result.gainEuros, 3.03);
  });

  test('throw si basePriceHt négatif', () => {
    assert.throws(
      () => calculateMargin({ basePriceHt: -1, marginRate: 15 }),
      /prix de base ne peut pas être négatif/
    );
  });

  test('throw si marginRate >= 100', () => {
    assert.throws(
      () => calculateMargin({ basePriceHt: 100, marginRate: 100 }),
      /taux de marge doit être entre 0 et 100/
    );
  });

  test('throw si marginRate négatif', () => {
    assert.throws(
      () => calculateMargin({ basePriceHt: 100, marginRate: -5 }),
      /taux de marge doit être entre 0 et 100/
    );
  });
});

// ============================================================================
// TESTS: calculateGainFromSellingPrice
// ============================================================================

describe('calculateGainFromSellingPrice (lecture DB)', () => {
  test('calcule gain depuis prix de vente DB', () => {
    const gain = calculateGainFromSellingPrice(100, 115);
    assert.strictEqual(gain, 15);
  });

  test('gère les décimales correctement', () => {
    const gain = calculateGainFromSellingPrice(20.19, 23.22);
    assert.strictEqual(gain, 3.03);
  });
});

// ============================================================================
// TESTS: calculateMarginRateFromPrices
// ============================================================================

describe('calculateMarginRateFromPrices (reverse engineering)', () => {
  test('retrouve le taux de marge depuis les prix', () => {
    // base=100, selling=115 → marge = (115-100)/100 * 100 = 15%
    const rate = calculateMarginRateFromPrices(100, 115);
    assert.strictEqual(rate, 15);
  });

  test('retourne 0 si base >= selling', () => {
    const rate = calculateMarginRateFromPrices(100, 100);
    assert.strictEqual(rate, 0);
  });

  test('throw si sellingPriceHt <= 0', () => {
    assert.throws(
      () => calculateMarginRateFromPrices(100, 0),
      /prix de vente doit être positif/
    );
  });

  test('throw si basePriceHt <= 0', () => {
    assert.throws(
      () => calculateMarginRateFromPrices(0, 100),
      /prix de base doit être positif/
    );
  });
});

// ============================================================================
// TESTS: calculateAffiliateCommission
// ============================================================================

describe('calculateAffiliateCommission (produits affiliés)', () => {
  test('calcule commission 15% sur produit affilié', () => {
    const result = calculateAffiliateCommission({
      sellingPriceHt: 500,
      commissionRate: 15,
    });

    assert.strictEqual(result.commissionEuros, 75);
    assert.strictEqual(result.affiliateReceives, 425);
    assert.strictEqual(result.commissionRate, 15);
  });

  test('calcule commission 5% (commission plateforme LinkMe)', () => {
    const result = calculateAffiliateCommission({
      sellingPriceHt: 115,
      commissionRate: 5,
    });

    // commission = 115 × 0.05 = 5.75
    assert.strictEqual(result.commissionEuros, 5.75);
    assert.strictEqual(result.affiliateReceives, 109.25);
  });

  test('gère commission 0%', () => {
    const result = calculateAffiliateCommission({
      sellingPriceHt: 100,
      commissionRate: 0,
    });

    assert.strictEqual(result.commissionEuros, 0);
    assert.strictEqual(result.affiliateReceives, 100);
  });
});

// ============================================================================
// TESTS: calculateCartTotals
// ============================================================================

describe('calculateCartTotals (panier)', () => {
  test('calcule totaux pour panier simple (1 item)', () => {
    const result = calculateCartTotals([
      { basePriceHt: 100, marginRate: 15, quantity: 1 },
    ]);

    assert.strictEqual(result.totalHT, 115);
    assert.strictEqual(result.totalTVA, 23); // 115 × 0.20
    assert.strictEqual(result.totalTTC, 138);
    assert.strictEqual(result.totalCommission, 15);
    assert.strictEqual(result.itemsCount, 1);
  });

  test('calcule totaux avec quantité > 1', () => {
    const result = calculateCartTotals([
      { basePriceHt: 100, marginRate: 15, quantity: 3 },
    ]);

    assert.strictEqual(result.totalHT, 345); // 115 × 3
    assert.strictEqual(result.totalCommission, 45); // 15 × 3
    assert.strictEqual(result.itemsCount, 3);
  });

  test('calcule totaux pour panier multi-items', () => {
    const result = calculateCartTotals([
      { basePriceHt: 100, marginRate: 15, quantity: 1 }, // 115, gain 15
      { basePriceHt: 50, marginRate: 10, quantity: 2 }, // 55 × 2 = 110, gain 5 × 2
    ]);

    // 115 + 110 = 225
    assert.strictEqual(result.totalHT, 225);
    // 15 + 10 = 25
    assert.strictEqual(result.totalCommission, 25);
    assert.strictEqual(result.itemsCount, 3);
  });

  test('utilise taux TVA personnalisé', () => {
    const result = calculateCartTotals(
      [{ basePriceHt: 100, marginRate: 15, quantity: 1 }],
      0 // Export hors UE = 0% TVA
    );

    assert.strictEqual(result.totalTVA, 0);
    assert.strictEqual(result.totalTTC, 115);
    assert.strictEqual(result.effectiveTaxRate, 0);
  });

  test('gère panier vide', () => {
    const result = calculateCartTotals([]);

    assert.strictEqual(result.totalHT, 0);
    assert.strictEqual(result.totalTVA, 0);
    assert.strictEqual(result.totalTTC, 0);
    assert.strictEqual(result.totalCommission, 0);
    assert.strictEqual(result.itemsCount, 0);
  });
});

// ============================================================================
// TESTS: Formatage
// ============================================================================

describe('formatEuros / formatPercent', () => {
  test('formate montant en euros (format FR)', () => {
    const formatted = formatEuros(115);
    // Format FR: "115,00 €" ou "115.00 €" selon locale
    assert.ok(formatted.includes('115'));
    assert.ok(formatted.includes('€'));
  });

  test('formate pourcentage', () => {
    const formatted = formatPercent(15);
    assert.strictEqual(formatted, '15.0%');
  });
});

// ============================================================================
// VALIDATION CROISÉE: Frontend vs DB
// ============================================================================

describe('Validation croisée Frontend/DB', () => {
  test('formule identique à la migration SQL (20260318200000_switch_to_additive_margin_model.sql)', () => {
    // La DB utilise: selling_price_ht = base_price_ht * (1 + margin_rate / 100)
    // Vérifions que notre code produit le même résultat

    const testCases = [
      { base: 100, margin: 15, expected: 115 },
      { base: 100, margin: 10, expected: 110 },
      { base: 100, margin: 20, expected: 120 },
      { base: 50, margin: 15, expected: 57.5 },
      { base: 20.19, margin: 15, expected: 23.22 },
    ];

    for (const tc of testCases) {
      const result = calculateMargin({
        basePriceHt: tc.base,
        marginRate: tc.margin,
      });
      assert.strictEqual(
        result.sellingPriceHt,
        tc.expected,
        `base=${tc.base}, margin=${tc.margin}: attendu ${tc.expected}, reçu ${result.sellingPriceHt}`
      );
    }
  });
});

// ============================================================================
// RÉSUMÉ
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`RÉSULTAT: ${passed} passés, ${failed} échoués`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}
